import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleMediaProxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const subPath = pathname.replace(/^\/media\/?/, "");
  const queryString = request.nextUrl.search;

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
      const targetUrl = `${host}/media/${subPath}${queryString}`;
      const res = await fetch(targetUrl, {
        method: request.method,
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
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastError = err;
    }
  }

  return NextResponse.json(
    { error: `Media proxy failed. ${lastError?.message || ""}` },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  return handleMediaProxy(request);
}
