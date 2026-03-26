"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function BackofficeLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/backoffice/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Falha no login.");
        return;
      }

      router.push("/backoffice");
      router.refresh();
    } catch {
      setError("Erro de rede ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="card stack admin-card">
        <h1>Backoffice</h1>
        <p className="muted admin-subtitle">Acesso restrito ao painel administrativo.</p>
        <form className="stack" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            autoComplete="username"
            placeholder="Login"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
