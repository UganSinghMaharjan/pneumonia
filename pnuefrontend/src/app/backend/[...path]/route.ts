import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleProxy(request: NextRequest) {
  // Extract subpath after /backend
  const pathname = request.nextUrl.pathname;
  const subPath = pathname.replace(/^\/backend\/?/, "");

  // Format Django URL path: ensure trailing slash if non-empty
  const urlPath = subPath ? (subPath.endsWith("/") ? subPath : `${subPath}/`) : "";
  const queryString = request.nextUrl.search;

  // Extract body for non-GET/HEAD methods
  let body: ArrayBuffer | undefined = undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    try {
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  // Copy relevant headers excluding host & content-length (recalculated)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "content-length") {
      headers.set(key, value);
    }
  });

  // Dual-stack fallback target list to support both Windows and Linux Django setups automatically
  const hosts = Array.from(
    new Set(
      [
        process.env.BACKEND_URL?.replace(/\/$/, ""),
        "http://127.0.0.1:8000",
        "http://localhost:8000",
      ].filter(Boolean)
    )
  ) as string[];

  let lastError: any = null;
  for (const host of hosts) {
    try {
      const targetUrl = `${host}/api/${urlPath}${queryString}`;
      const res = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: body && body.byteLength > 0 ? body : undefined,
        // @ts-ignore
        duplex: "half",
      });

      const responseHeaders = new Headers();
      res.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "content-encoding") {
          responseHeaders.set(key, value);
        }
      });

      const resBuffer = await res.arrayBuffer();
      return new NextResponse(resBuffer, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastError = err;
    }
  }

  return NextResponse.json(
    { error: `Backend connection failed. ${lastError?.message || "Server unreachable"}` },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}

export async function PUT(request: NextRequest) {
  return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleProxy(request);
}

export async function HEAD(request: NextRequest) {
  return handleProxy(request);
}
