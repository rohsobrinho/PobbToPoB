import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRecentSearches } from "@/lib/db";
import { getSessionCookieName, isValidBackofficeSession } from "@/lib/backoffice-auth";
import LogoutButton from "./logout-button";
import ClearDuplicatesButton from "./clear-duplicates-button";
import { findRepeatedSearches } from "@/lib/repeated-searches";

type GroupedItem = {
  label: string;
  count: number;
};

function getWords(input: string) {
  return input
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function groupSearchesByPenultimateWord(buildNames: string[]) {
  const grouped = new Map<string, number>();

  for (const buildName of buildNames) {
    const words = getWords(buildName);
    const label = words.length >= 2 ? words[words.length - 2] : buildName;
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function groupSearchesByTrimmedBuildName(buildNames: string[]) {
  const grouped = new Map<string, number>();

  for (const buildName of buildNames) {
    const words = getWords(buildName);
    const trimmedWords = words.slice(2, -2);
    const label = trimmedWords.join(" ").trim();

    if (!label) {
      continue;
    }

    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export default async function BackofficePage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName())?.value;

  if (!isValidBackofficeSession(sessionValue)) {
    redirect("/backoffice/login");
  }

  const searches = await getRecentSearches();
  const repeatedSearches = findRepeatedSearches(searches);
  const buildNames = searches.map((search) => search.build_name);
  const penultimateWordGroups = groupSearchesByPenultimateWord(buildNames);
  const trimmedBuildNameGroups = groupSearchesByTrimmedBuildName(buildNames);

  return (
    <main className="admin-main">
      <div className="card stack admin-card">
        <div className="admin-header">
          <div>
            <h1>Backoffice</h1>
            <p className="muted admin-subtitle">
              Painel administrativo para acompanhar buscas repetidas e agrupamentos.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="admin-panels">
          <section className="admin-panel stack">
            <div className="admin-panel-header">
              <div>
                <h2>Duplicidades</h2>
                <p className="muted admin-subtitle">
                  Buscas repetidas com intervalo menor ou igual a 4 minutos.
                </p>
              </div>
              {repeatedSearches.length > 0 ? <ClearDuplicatesButton /> : null}
            </div>

            {repeatedSearches.length === 0 ? (
              <div className="admin-empty-state">
                <h3>Nenhum resultado encontrado.</h3>
                <p className="muted">
                  Não há duplicidades registradas no intervalo configurado.
                </p>
              </div>
            ) : (
              <div className="admin-list">
                {repeatedSearches.map((search) => (
                  <article
                    key={`${search.url}-${search.created_at}`}
                    className="admin-list-item"
                  >
                    <h2>{search.build_name}</h2>
                    <p className="admin-url">{search.url}</p>
                    <p className="admin-meta">
                      Atual: {new Date(search.created_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="admin-meta">
                      Anterior: {new Date(search.previousCreatedAt).toLocaleString("pt-BR")}
                    </p>
                    <p className="admin-meta">Intervalo: {search.diffSeconds}s</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-panel stack">
            <div className="admin-panel-header">
              <div>
                <h2>Penúltima Palavra</h2>
                <p className="muted admin-subtitle">
                  Agrupamento de todas as buscas pela penúltima palavra do nome do build.
                </p>
              </div>
            </div>

            <div className="admin-group-list">
              {penultimateWordGroups.map((item) => (
                <article key={item.label} className="admin-group-item">
                  <span className="admin-group-label">{item.label}</span>
                  <span className="admin-group-count">{item.count}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-panel stack">
            <div className="admin-panel-header">
              <div>
                <h2>Build Name Podado</h2>
                <p className="muted admin-subtitle">
                  Mesma lista agrupada após remover as 2 primeiras e as 2 últimas palavras.
                </p>
              </div>
            </div>

            <div className="admin-group-list">
              {trimmedBuildNameGroups.map((item) => (
                <article key={item.label} className="admin-group-item">
                  <span className="admin-group-label">{item.label}</span>
                  <span className="admin-group-count">{item.count}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
