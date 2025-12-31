import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * CloudflareService - Handles domain automation via Cloudflare API
 * 
 * Workflow:
 * 1. createZone() - Creates zone (domain) in Cloudflare (status: pending)
 * 2. getZoneNameservers() - Returns nameservers for user to set at registrar
 * 3. pollZoneStatus() - Waits until zone is active (nameservers propagated)
 * 4. configureDNS() - Sets CNAME record pointing to tunnel
 * 5. addDomainToTunnel() - Updates tunnel ingress rules
 * 
 * Architecture:
 * - Uses a single shared Cloudflare Tunnel
 * - Ingress rules added per domain
 * - Routing based on Host header
 * - CNAME flattening for root domain (Cloudflare-specific feature)
 */
@Injectable()
export class CloudflareService {
    private readonly logger = new Logger(CloudflareService.name);
    private readonly api: AxiosInstance;
    private readonly accountId: string;
    private readonly tunnelId: string;
    private readonly frontendServiceUrl: string;
    private readonly backendServiceUrl: string;

    constructor(private config: ConfigService) {
        const apiToken = this.config.get<string>('CLOUDFLARE_API_TOKEN', '');
        this.accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID', '');
        this.tunnelId = this.config.get<string>('CLOUDFLARE_TUNNEL_ID', '');

        // Configurable service URLs for tunnel routing
        this.frontendServiceUrl = this.config.get<string>('TUNNEL_FRONTEND_URL', 'http://localhost:3002');
        this.backendServiceUrl = this.config.get<string>('TUNNEL_BACKEND_URL', 'http://localhost:3001');

        this.api = axios.create({
            baseURL: 'https://api.cloudflare.com/client/v4',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
        });

        this.logger.log(`CloudflareService initialized with frontend URL: ${this.frontendServiceUrl}, backend URL: ${this.backendServiceUrl}`);
    }

    /**
     * Step 1: Create a new zone (domain) in Cloudflare
     * Zone will be in 'pending' status until nameservers are updated at registrar
     * 
     * Edge Cases Handled:
     * - Error 1061: Zone already exists - looks up existing zone and returns its details
     */
    async createZone(domain: string): Promise<{
        zoneId: string;
        nameservers: string[];
        status: string;
    }> {
        this.logger.log(`Creating zone for domain: ${domain}`);
        this.logger.log(`Using account ID: ${this.accountId}`);
        this.logger.log(`Tunnel ID configured: ${this.tunnelId}`);

        try {
            const requestBody = {
                account: { id: this.accountId },
                name: domain,
                type: 'full', // Full DNS management
            };

            this.logger.log(`Request body: ${JSON.stringify(requestBody)}`);

            const response = await this.api.post('/zones', requestBody);

            this.logger.log(`Cloudflare response status: ${response.status}`);
            this.logger.log(`Cloudflare response data: ${JSON.stringify(response.data)}`);

            const zone = response.data.result;

            return {
                zoneId: zone.id,
                nameservers: zone.name_servers,
                status: zone.status, // 'pending' initially
            };
        } catch (error: any) {
            const cfErrors = error.response?.data?.errors || [];

            // Handle edge case: Zone already exists (error code 1061)
            const zoneExistsError = cfErrors.find((e: any) => e.code === 1061);
            if (zoneExistsError) {
                this.logger.warn(`Zone for ${domain} already exists in Cloudflare, looking up existing zone...`);

                try {
                    // Look up the existing zone by domain name
                    const existingZone = await this.getZoneByDomain(domain);
                    if (existingZone) {
                        this.logger.log(`Found existing zone: ${existingZone.zoneId}`);
                        return existingZone;
                    }
                } catch (lookupError: any) {
                    this.logger.error(`Failed to lookup existing zone: ${lookupError.message}`);
                }
            }

            // Log the FULL Cloudflare error response for debugging
            this.logger.error('=== CLOUDFLARE API ERROR ===');
            this.logger.error(`Domain: ${domain}`);
            this.logger.error(`Account ID: ${this.accountId}`);
            this.logger.error(`HTTP Status: ${error.response?.status}`);
            this.logger.error(`Status Text: ${error.response?.statusText}`);
            this.logger.error(`Error Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
            this.logger.error(`Cloudflare Errors: ${JSON.stringify(error.response?.data?.errors, null, 2)}`);
            this.logger.error(`Cloudflare Messages: ${JSON.stringify(error.response?.data?.messages, null, 2)}`);
            this.logger.error(`Request URL: ${error.config?.url}`);
            this.logger.error(`Request Method: ${error.config?.method}`);
            this.logger.error(`Request Data: ${error.config?.data}`);
            this.logger.error('=== END CLOUDFLARE API ERROR ===');

            // Extract meaningful error message from Cloudflare response
            const errorMessage = cfErrors.length > 0
                ? cfErrors.map((e: any) => `[${e.code}] ${e.message}`).join(', ')
                : error.message;

            throw new Error(`Cloudflare API Error: ${errorMessage}`);
        }
    }

    /**
     * Look up an existing zone by domain name
     */
    async getZoneByDomain(domain: string): Promise<{
        zoneId: string;
        nameservers: string[];
        status: string;
    } | null> {
        this.logger.log(`Looking up zone for domain: ${domain}`);

        try {
            const response = await this.api.get('/zones', {
                params: {
                    name: domain,
                    account: { id: this.accountId },
                },
            });

            const zones = response.data.result || [];

            if (zones.length > 0) {
                const zone = zones[0];
                this.logger.log(`Found zone: ${zone.id} with status: ${zone.status}`);
                return {
                    zoneId: zone.id,
                    nameservers: zone.name_servers || [],
                    status: zone.status,
                };
            }

            this.logger.warn(`No zone found for domain: ${domain}`);
            return null;
        } catch (error: any) {
            this.logger.error(`Failed to lookup zone by domain: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get zone details including nameservers
     */
    async getZone(zoneId: string): Promise<{
        status: string;
        nameservers: string[];
    }> {
        const response = await this.api.get(`/zones/${zoneId}`);
        const zone = response.data.result;

        return {
            status: zone.status,
            nameservers: zone.name_servers,
        };
    }

    /**
     * Step 2: Check zone status
     * Returns 'pending' until nameservers are updated, then 'active'
     */
    async getZoneStatus(zoneId: string): Promise<string> {
        const response = await this.api.get(`/zones/${zoneId}`);
        return response.data.result.status;
    }

    /**
     * Step 3: Configure DNS records to point to tunnel
     * Uses CNAME flattening for root domain (Cloudflare-specific)
     * 
     * IMPORTANT: First clears conflicting A/AAAA records from registrar
     * 
     * Edge Cases Handled:
     * - Existing A/AAAA records from registrar - removes them first
     * - Error 81057/81058: Record already exists - skips creating duplicate records
     */
    async configureDNS(zoneId: string, domain: string): Promise<void> {
        this.logger.log(`Configuring DNS for zone: ${zoneId}`);

        // First, clear any conflicting A/AAAA records from registrar
        await this.clearConflictingDNS(zoneId, domain);

        const tunnelDomain = `${this.tunnelId}.cfargotunnel.com`;
        this.logger.log(`Tunnel domain: ${tunnelDomain}`);

        // Root domain CNAME to tunnel (using @ for apex)
        // Cloudflare automatically flattens this to A records
        await this.createDnsRecord(zoneId, {
            type: 'CNAME',
            name: '@',
            content: tunnelDomain,
            proxied: true,
            ttl: 1, // Auto
            comment: 'ServicePulse - Root domain to tunnel',
        });

        // www subdomain CNAME to root
        await this.createDnsRecord(zoneId, {
            type: 'CNAME',
            name: 'www',
            content: domain,
            proxied: true,
            ttl: 1,
            comment: 'ServicePulse - WWW redirect',
        });

        this.logger.log(`DNS configured for ${domain}`);
    }

    /**
     * Clear conflicting DNS records from registrar
     * Removes A, AAAA records for root (@) and www that point to parked pages
     */
    async clearConflictingDNS(zoneId: string, domain: string): Promise<void> {
        this.logger.log(`Clearing conflicting DNS records for zone: ${zoneId}`);

        try {
            // Get all DNS records for this zone
            const response = await this.api.get(`/zones/${zoneId}/dns_records`);
            const records = response.data.result || [];

            // Find conflicting records (A/AAAA for root and www)
            const conflictingRecords = records.filter((record: any) => {
                const isRootOrWww = record.name === domain || record.name === `www.${domain}`;
                const isConflictingType = ['A', 'AAAA'].includes(record.type);
                return isRootOrWww && isConflictingType;
            });

            this.logger.log(`Found ${conflictingRecords.length} conflicting records to remove`);

            // Delete each conflicting record
            for (const record of conflictingRecords) {
                try {
                    this.logger.log(`Deleting ${record.type} record: ${record.name} -> ${record.content}`);
                    await this.api.delete(`/zones/${zoneId}/dns_records/${record.id}`);
                    this.logger.log(`Deleted record ${record.id}`);
                } catch (error: any) {
                    this.logger.warn(`Failed to delete record ${record.id}: ${error.message}`);
                    // Continue with other records even if one fails
                }
            }

            this.logger.log(`Finished clearing conflicting DNS records`);
        } catch (error: any) {
            this.logger.error(`Failed to clear DNS records: ${error.message}`);
            // Don't throw - continue with adding our records
        }
    }

    /**
     * Helper method to create a DNS record with proper error handling
     */
    private async createDnsRecord(
        zoneId: string,
        record: {
            type: string;
            name: string;
            content: string;
            proxied: boolean;
            ttl: number;
            comment: string;
        }
    ): Promise<void> {
        try {
            this.logger.log(`Creating DNS record: ${record.type} ${record.name} -> ${record.content}`);

            await this.api.post(`/zones/${zoneId}/dns_records`, record);

            this.logger.log(`DNS record created successfully: ${record.name}`);
        } catch (error: any) {
            const cfErrors = error.response?.data?.errors || [];

            // Handle edge case: Record already exists (error codes 81057, 81058)
            const recordExistsError = cfErrors.find((e: any) =>
                e.code === 81057 || e.code === 81058 ||
                e.message?.includes('already exists') ||
                e.message?.includes('Record with this content')
            );

            if (recordExistsError) {
                this.logger.warn(`DNS record ${record.name} already exists, skipping...`);
                return; // Not an error, just skip
            }

            // Log and throw for other errors
            this.logger.error('=== CLOUDFLARE DNS RECORD ERROR ===');
            this.logger.error(`Zone ID: ${zoneId}`);
            this.logger.error(`Record: ${JSON.stringify(record)}`);
            this.logger.error(`HTTP Status: ${error.response?.status}`);
            this.logger.error(`Error Response: ${JSON.stringify(error.response?.data, null, 2)}`);
            this.logger.error('=== END DNS RECORD ERROR ===');

            const errorMessage = cfErrors.length > 0
                ? cfErrors.map((e: any) => `[${e.code}] ${e.message}`).join(', ')
                : error.message;

            throw new Error(`DNS Record Error: ${errorMessage}`);
        }
    }

    /**
     * Step 4: Add domain to existing Cloudflare Tunnel ingress
     * Updates tunnel configuration to route this domain to the frontend app
     * Use optional serviceUrl parameter to override default frontend URL
     */
    async addDomainToTunnel(domain: string, serviceUrl?: string): Promise<void> {
        const targetUrl = serviceUrl || this.frontendServiceUrl;
        this.logger.log(`Adding ${domain} to tunnel ${this.tunnelId} -> ${targetUrl}`);

        try {
            // Get current tunnel configuration
            const configResponse = await this.api.get(
                `/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`
            );

            const currentConfig = configResponse.data.result.config || { ingress: [] };
            const ingress = currentConfig.ingress || [];

            // Check if domain already exists - log if updating
            const existingEntry = ingress.find((rule: any) => rule.hostname === domain);
            if (existingEntry) {
                this.logger.log(`Updating existing tunnel entry for ${domain}: ${existingEntry.service} -> ${targetUrl}`);
            }

            // Filter out catch-all rule and existing entries for this domain (we'll re-add with correct URL)
            const catchAllRule = ingress.find((rule: any) => !rule.hostname);
            const otherDomainRules = ingress.filter((rule: any) =>
                rule.hostname &&
                rule.hostname !== domain &&
                rule.hostname !== `www.${domain}`
            );

            const newIngress = [
                ...otherDomainRules,
                {
                    hostname: domain,
                    service: targetUrl,
                },
                {
                    hostname: `www.${domain}`,
                    service: targetUrl,
                },
                // Always end with catch-all
                catchAllRule || { service: 'http_status:404' },
            ];

            // Update tunnel configuration
            await this.api.put(
                `/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`,
                {
                    config: {
                        ...currentConfig,
                        ingress: newIngress,
                    },
                }
            );

            this.logger.log(`Domain ${domain} added to tunnel ingress`);
        } catch (error: any) {
            this.logger.error('=== CLOUDFLARE TUNNEL ERROR ===');
            this.logger.error(`Domain: ${domain}`);
            this.logger.error(`Tunnel ID: ${this.tunnelId}`);
            this.logger.error(`HTTP Status: ${error.response?.status}`);
            this.logger.error(`Error Response: ${JSON.stringify(error.response?.data, null, 2)}`);
            this.logger.error('=== END TUNNEL ERROR ===');

            const cfErrors = error.response?.data?.errors || [];
            const errorMessage = cfErrors.length > 0
                ? cfErrors.map((e: any) => `[${e.code}] ${e.message}`).join(', ')
                : error.message;

            throw new Error(`Tunnel Config Error: ${errorMessage}`);
        }
    }

    /**
     * Remove domain from tunnel ingress
     */
    async removeDomainFromTunnel(domain: string): Promise<void> {
        this.logger.log(`Removing ${domain} from tunnel ${this.tunnelId}`);

        const configResponse = await this.api.get(
            `/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`
        );

        const currentConfig = configResponse.data.result.config || { ingress: [] };
        const ingress = currentConfig.ingress || [];

        // Filter out this domain and www subdomain
        const newIngress = ingress.filter(
            (rule: any) => rule.hostname !== domain && rule.hostname !== `www.${domain}`
        );

        await this.api.put(
            `/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`,
            {
                config: {
                    ...currentConfig,
                    ingress: newIngress,
                },
            }
        );

        this.logger.log(`Domain ${domain} removed from tunnel`);
    }

    /**
     * Enable SSL/TLS Full Strict mode for zone
     */
    async enableSSL(zoneId: string): Promise<void> {
        this.logger.log(`Enabling SSL Full Strict for zone: ${zoneId}`);

        try {
            await this.api.patch(`/zones/${zoneId}/settings/ssl`, {
                value: 'full',
            });
            this.logger.log(`SSL mode set to 'full' for zone ${zoneId}`);
        } catch (error: any) {
            this.logger.warn(`Failed to set SSL mode: ${error.response?.data?.errors?.[0]?.message || error.message}`);
            // Don't throw - SSL setting might already be configured
        }

        try {
            // Also enable Always Use HTTPS
            await this.api.patch(`/zones/${zoneId}/settings/always_use_https`, {
                value: 'on',
            });
            this.logger.log(`Always Use HTTPS enabled for zone ${zoneId}`);
        } catch (error: any) {
            this.logger.warn(`Failed to enable Always Use HTTPS: ${error.response?.data?.errors?.[0]?.message || error.message}`);
            // Don't throw - setting might already be configured
        }

        this.logger.log(`SSL configuration completed for zone ${zoneId}`);
    }

    /**
     * Delete a zone from Cloudflare
     */
    async deleteZone(zoneId: string): Promise<void> {
        this.logger.log(`Deleting zone: ${zoneId}`);
        await this.api.delete(`/zones/${zoneId}`);
    }

    /**
     * Verify API token is valid
     */
    async verifyToken(): Promise<boolean> {
        try {
            const response = await this.api.get('/user/tokens/verify');
            return response.data.success === true;
        } catch (error) {
            this.logger.error('Cloudflare API token verification failed', error);
            return false;
        }
    }

    /**
     * List all zones in account
     */
    async listZones(): Promise<Array<{ id: string; name: string; status: string }>> {
        const response = await this.api.get('/zones', {
            params: {
                account: { id: this.accountId },
                per_page: 50,
            },
        });

        return response.data.result.map((zone: any) => ({
            id: zone.id,
            name: zone.name,
            status: zone.status,
        }));
    }

    /**
     * Get current tunnel ingress configuration
     */
    async getTunnelIngress(): Promise<Array<{ hostname: string; service: string }>> {
        const response = await this.api.get(
            `/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`
        );

        const config = response.data.result.config || { ingress: [] };
        return config.ingress || [];
    }
}
