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

  console.log(error);

  if (error) {
    throw new Error(`Falha ao salvar consulta: ${error.message}`);
  }
}
