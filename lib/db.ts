import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  // eslint-disable-next-line no-var
  var __pobbSupabase: SupabaseClient | undefined;
}

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL;
  if (!value) {
    throw new Error("SUPABASE_URL nao configurada.");
  }

  return value;
}

function getSupabaseAnonKey() {
  const value = process.env.SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error("SUPABASE_ANON_KEY nao configurada.");
  }

  return value;
}

function getSupabaseServerKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? getSupabaseAnonKey();
}

export const db =
  global.__pobbSupabase ??
  createClient(getSupabaseUrl(), getSupabaseServerKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

if (process.env.NODE_ENV !== "production") {
  global.__pobbSupabase = db;
}

export async function saveSearch(url: string, buildName: string) {
  const { error } = await db.from("searchs").insert({
    url,
    build_name: buildName
  });

  if (error) {
    throw new Error(`Falha ao salvar consulta: ${error.message}`);
  }
}

export type SearchRow = {
  id?: string;
  url: string;
  build_name: string;
  created_at: string;
};

export async function getRecentSearches(limit = 1000) {
  const { data, error } = await db
    .from("searchs")
    .select("id, url, build_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Falha ao carregar consultas: ${error.message}`);
  }

  return (data ?? []) as SearchRow[];
}

export async function deleteSearchById(id: string) {
  const { error } = await db.from("searchs").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao deletar consulta: ${error.message}`);
  }
}

export async function deleteSearchesByIds(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const { error } = await db.from("searchs").delete().in("id", ids);

  if (error) {
    throw new Error(`Falha ao deletar consultas: ${error.message}`);
  }
}
