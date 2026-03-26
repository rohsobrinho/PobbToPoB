import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, isValidBackofficeSession } from "@/lib/backoffice-auth";
import { deleteSearchesByIds, getRecentSearches } from "@/lib/db";
import { findRepeatedSearches } from "@/lib/repeated-searches";

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName())?.value;

  if (!isValidBackofficeSession(sessionValue)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const searches = await getRecentSearches();
  const repeatedSearches = findRepeatedSearches(searches);
  const idsToDelete = repeatedSearches
    .map((search) => search.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  await deleteSearchesByIds(idsToDelete);

  return NextResponse.json({
    ok: true,
    deletedCount: idsToDelete.length
  });
}
