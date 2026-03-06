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

function extractClosestH1AboveAscendancyImage(html: string) {
  const imgRegex = /<img\b[^>]*\balt\s*=\s*["']Ascendancy Thumbnail["'][^>]*>/i;
  const imgMatch = imgRegex.exec(html);
  if (!imgMatch || imgMatch.index < 0) {
    return null;
  }

  const targetIndex = imgMatch.index;
  const h1Regex = /<h1\b[^>]*>[\s\S]*?<\/h1>/gi;
  let match: RegExpExecArray | null;
  let closestH1Html: string | null = null;

  while ((match = h1Regex.exec(html)) !== null) {
    if (match.index >= targetIndex) {
      break;
    }
    closestH1Html = match[0];
  }

  return closestH1Html;
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

function removeQueryParams(input: string) {
  const parsed = new URL(input);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const rawUrl = body?.url?.trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "URL obrigatoria." }, { status: 400 });
  }

  if (!isAllowedPobbUrl(rawUrl)) {
    return NextResponse.json(
      { error: "Somente URLs de pobb.in sao permitidas." },
      { status: 400 }
    );
  }

  try {
    const url = removeQueryParams(rawUrl);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "PobbToPoB/1.0 (+vercel)" }
    });

    const text = await response.text();
    const buildcode = extractBuildcode(text);
    const ascendancyH1Html = extractClosestH1AboveAscendancyImage(text);
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
      ascendancyH1Html,
      buildcode
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar a URL informada." },
      { status: 502 }
    );
  }
}
