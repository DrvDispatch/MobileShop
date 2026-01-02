import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Catch-all proxy handler that forwards requests to backend while preserving the Host header
 * This is essential for multi-tenant resolution - the backend needs to know which
 * domain the request came from to resolve the correct tenant.
 */
async function proxyRequest(req: NextRequest, pathSegments: string[]) {
    const path = `/api/${pathSegments.join("/")}`;

    const incomingHost =
        req.headers.get("host") ??
        req.headers.get("x-forwarded-host") ??
        "";

    const headers = new Headers();

    // Forward essential headers
    headers.set("content-type", req.headers.get("content-type") || "application/json");
    headers.set("accept", req.headers.get("accept") || "application/json");

    // Preserve host for tenant resolution
    if (incomingHost) {
        headers.set("host", incomingHost);
        headers.set("x-forwarded-host", incomingHost);
    }

    // Forward auth if present
    const auth = req.headers.get("authorization");
    if (auth) {
        headers.set("authorization", auth);
    }

    // Forward cookies
    const cookies = req.headers.get("cookie");
    if (cookies) {
        headers.set("cookie", cookies);
    }

    // Build URL with query string if present
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}${path}${searchParams ? `?${searchParams}` : ""}`;

    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
        try {
            body = await req.text();
        } catch {
            body = undefined;
        }
    }

    const upstream = await fetch(url, {
        method: req.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",  // CRITICAL: Don't follow redirects, pass them through
    });

    // Handle redirects - pass them through to the browser
    if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get("location");
        if (location) {
            console.log("[Proxy] Passing through redirect to:", location);
            return NextResponse.redirect(location, upstream.status);
        }
    }

    // Handle suspended tenant - redirect to /suspended page
    if (upstream.status === 403) {
        try {
            const body = await upstream.clone().json();
            if (body.code === "TENANT_SUSPENDED") {
                console.log("[Proxy] Tenant suspended, redirecting to /suspended");
                return NextResponse.redirect(new URL("/suspended", req.url), 302);
            }
        } catch {
            // Not JSON or other error, fall through to normal handling
        }
    }

    // Forward response headers that matter
    const responseHeaders = new Headers();
    responseHeaders.set("content-type", upstream.headers.get("content-type") || "application/json");

    // Forward set-cookie headers if present
    // Note: headers.get('set-cookie') doesn't work in Node.js fetch - use getSetCookie()
    const setCookies = upstream.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
        console.log("[Proxy] Forwarding Set-Cookie headers:", setCookies.length);
        for (const cookie of setCookies) {
            responseHeaders.append("set-cookie", cookie);
        }
    } else {
        // Fallback for environments without getSetCookie
        const setCookie = upstream.headers.get("set-cookie");
        if (setCookie) {
            console.log("[Proxy] Forwarding Set-Cookie header (fallback):", setCookie.substring(0, 50) + "...");
            responseHeaders.set("set-cookie", setCookie);
        }
    }
    // Check if response is binary (PDF, images, etc.)
    const contentType = upstream.headers.get("content-type") || "application/json";
    const isBinary = contentType.includes("application/pdf") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("image/");

    if (isBinary) {
        // Handle binary content properly - don't convert to text
        const buffer = await upstream.arrayBuffer();
        responseHeaders.set("content-length", buffer.byteLength.toString());

        // Forward content-disposition if present (for downloads)
        const contentDisposition = upstream.headers.get("content-disposition");
        if (contentDisposition) {
            responseHeaders.set("content-disposition", contentDisposition);
        }

        return new NextResponse(buffer, {
            status: upstream.status,
            headers: responseHeaders,
        });
    }

    // Handle text/JSON responses normally
    const responseBody = await upstream.text();

    return new NextResponse(responseBody, {
        status: upstream.status,
        headers: responseHeaders,
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(req, path);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(req, path);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(req, path);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(req, path);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(req, path);
}
