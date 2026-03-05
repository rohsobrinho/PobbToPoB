import { NextResponse } from "next/server";

type RequestBody = { url?: string };

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/");
}

function extractBuildcode(html: string) {
  const elementRegex =
    /<(?:div|textarea)\b[^>]*\baria-label\s*=\s*["']Path of Building buildcode["'][^>]*>([\s\S]*?)<\/(?:div|textarea)>/i;
  const match = html.match(elementRegex);
  if (!match?.[1]) {
    return null;
  }

  // Remove nested tags and normalize spacing before returning the code.
  const raw = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) {
    return null;
  }

  return decodeHtmlEntities(raw);
}

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
    const buildcode = extractBuildcode(text);
    if (!buildcode) {
      return NextResponse.json(
        { error: "Buildcode nao encontrado no resultado da requisicao." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      buildcode
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar a URL informada." },
      { status: 502 }
    );
  }
}
