import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Proxy handler that forwards requests to backend while preserving the Host header
 * This is essential for multi-tenant resolution - the backend needs to know which
 * domain the request came from to resolve the correct tenant.
 */
async function proxyRequest(req: NextRequest, path: string) {
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

    const url = `${BACKEND_URL}${path}`;

    const upstream = await fetch(url, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
        cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new NextResponse(body, {
        status: upstream.status,
        headers: {
            "content-type": contentType,
        },
    });
}

export async function GET(req: NextRequest) {
    return proxyRequest(req, "/api/tenant/config");
}
