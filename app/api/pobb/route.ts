import { NextResponse } from "next/server";

type RequestBody = { url?: string };

function isAllowedPobbUrl(input: string) {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }

  const protocolOk = parsed.protocol === "http:" || parsed.protocol === "https:";
  const hostOk = parsed.hostname === "pobb.in" || parsed.hostname === "www.pobb.in";
  return protocolOk && hostOk;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const url = body?.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "URL obrigatoria." }, { status: 400 });
  }

  if (!isAllowedPobbUrl(url)) {
    return NextResponse.json(
      { error: "Somente URLs de pobb.in sao permitidas." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "PobbToPoB/1.0 (+vercel)" }
    });

    const text = await response.text();
    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? "desconhecido",
      body: text
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar a URL informada." },
      { status: 502 }
    );
  }
}
