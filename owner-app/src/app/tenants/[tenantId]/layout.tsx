
import { TenantProvider } from './tenant-context';
import { TenantLayoutContent } from './client-layout';

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = await params;

    return (
        <TenantProvider tenantId={tenantId}>
            <TenantLayoutContent tenantId={tenantId}>
                {children}
            </TenantLayoutContent>
        </TenantProvider>
    );
}
