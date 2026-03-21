"use client";

import { FormEvent, useState } from "react";

type FetchResult = {
  ok: boolean;
  status: number;
  finalUrl: string;
  ascendancyH1Html: string | null;
  buildcode: string;
  poeNinjaCode: string | null;
  poeNinjaUrl: string | null;
  error?: string;
};

export default function HomePage() {
  const [url, setUrl] = useState(""); // https://pobb.in/3J6Dm6pkA6-5
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);

  async function copyBuildcode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Nao foi possivel copiar para o clipboard.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/pobb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const payload = (await response.json()) as FetchResult;
      if (!response.ok) {
        setError(payload.error ?? "Falha ao buscar URL.");
      } else {
        setResult(payload);
      }
    } catch {
      setError("Erro de rede ao chamar a API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="card stack">
        <h1>Consulta de URL pobb.in</h1>
        <p className="muted">
          Informe uma URL como <code>https://pobb.in/3J6Dm6pkA6-5</code> e veja
          o retorno da requisição.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <input
            className="input"
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://pobb.in/..."
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        {result ? (
          <div className="stack">
            {result.ascendancyH1Html ? (
              <div
                className="muted"
                dangerouslySetInnerHTML={{ __html: result.ascendancyH1Html }}
              />
            ) : null}
            <input
              className="response-line"
              value={result.buildcode}
              readOnly
              onClick={() => copyBuildcode(result.buildcode)}
              title="Clique para copiar"
            />
            <button
              className="button"
              type="button"
              onClick={() => copyBuildcode(result.buildcode)}
            >
              Copiar code
            </button>
            {result.poeNinjaCode ? (
              <a
                className="button pob-button"
                href={`pob://poeninja/${result.poeNinjaCode}`}
              >
                Abrir no PoB
              </a>
            ) : null}
            {copied ? <p className="success">Copiado! Importe no seu PoB.</p> : null}
          </div>
        ) : null}
      </div>
      <a
        className="repo-fab"
        href="https://github.com/rohsobrinho/PobbToPoB"
        target="_blank"
        rel="noreferrer"
      >
        <svg
          className="repo-fab-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.48 1 .11-.77.42-1.29.76-1.59-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z"
          />
        </svg>
        <span>GitHub</span>
      </a>
      <img
        style={{display: "none"}}
        className="pix-qr"
        src="/hylario-qr.png"
        alt="QR code pixgg.com/Hylario"
        onError={() => setQrMissing(true)}
      />
      {qrMissing ? (
        <p className="pix-qr-missing">Imagem ausente: /public/hylario-qr.png</p>
      ) : null}
      <p className="repo-credit">
        Criado por{" "}
        <a
          href="https://www.pathofexile.com/account/view-profile/Hylario-7233"
          target="_blank"
          rel="noreferrer"
        >
          Hylario
        </a>
        .
      </p>
    </main>
  );
}
