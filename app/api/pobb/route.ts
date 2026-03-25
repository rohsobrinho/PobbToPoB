import { NextResponse } from "next/server";
import { saveSearch } from "@/lib/db";

type RequestBody = { url?: string };

type PoeNinjaUploadResult = {
  poeNinjaCode: string | null;
  poeNinjaUrl: string | null;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/");
}

function extractPlainTextFromHtml(html: string | null) {
  if (!html) {
    return "Consulta sem nome";
  }

  const raw = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return decodeHtmlEntities(raw) || "Consulta sem nome";
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

function extractLastPathSegment(input: string) {
  try {
    const parsed = new URL(input);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

async function uploadToPoeNinja(code: string): Promise<PoeNinjaUploadResult> {
  const endpoint = "https://poe.ninja/poe1/pob/api/upload";
  const payloads: BodyInit[] = [
    JSON.stringify({ code }),
    new URLSearchParams({ code }),
    (() => {
      const formData = new FormData();
      formData.set("code", code);
      return formData;
    })()
  ];

  const headersList: HeadersInit[] = [
    { "Content-Type": "application/json" },
    { "Content-Type": "application/x-www-form-urlencoded" },
    {}
  ];

  for (let index = 0; index < payloads.length; index += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headersList[index],
        body: payloads[index]
      });

      if (!response.ok) {
        continue;
      }

      const responseText = (await response.text()).trim();
      if (!responseText) {
        continue;
      }

      let poeNinjaUrl: string | null = null;
      const jsonMatch = responseText.startsWith("{")
        ? JSON.parse(responseText)
        : null;

      if (typeof jsonMatch === "string") {
        poeNinjaUrl = jsonMatch;
      } else if (jsonMatch && typeof jsonMatch === "object") {
        const possibleUrl = [
          "url",
          "result",
          "location",
          "link"
        ].map((key) => jsonMatch[key as keyof typeof jsonMatch]);
        const firstUrl = possibleUrl.find((value) => typeof value === "string");
        poeNinjaUrl = typeof firstUrl === "string" ? firstUrl : null;
      } else if (responseText.startsWith("http")) {
        poeNinjaUrl = responseText;
      }

      const poeNinjaCode = poeNinjaUrl ? extractLastPathSegment(poeNinjaUrl) : null;
      if (poeNinjaCode) {
        return { poeNinjaCode, poeNinjaUrl };
      }
    } catch {
      continue;
    }
  }

  return { poeNinjaCode: null, poeNinjaUrl: null };
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

    const buildName = extractPlainTextFromHtml(ascendancyH1Html);
    await saveSearch(url, buildName);

    const { poeNinjaCode, poeNinjaUrl } = await uploadToPoeNinja(buildcode);

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      ascendancyH1Html,
      buildcode,
      poeNinjaCode,
      poeNinjaUrl
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar a URL informada." },
      { status: 502 }
    );
  }
}
