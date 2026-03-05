"use client";

import { FormEvent, useState } from "react";

type FetchResult = {
  ok: boolean;
  status: number;
  finalUrl: string;
  body: string;
  contentType: string;
  error?: string;
};

export default function HomePage() {
  const [url, setUrl] = useState("https://pobb.in/3J6Dm6pkA6-5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

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
          o retorno da requisicao.
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
            <p className="muted">Status: {result.status}</p>
            <p className="muted">URL final: {result.finalUrl}</p>
            <p className="muted">Content-Type: {result.contentType}</p>
            <pre className="response">{result.body}</pre>
          </div>
        ) : null}
      </div>
    </main>
  );
}
