import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, isValidBackofficeSession } from "@/lib/backoffice-auth";
import { deleteSearchById } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName())?.value;

  if (!isValidBackofficeSession(sessionValue)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id || id.trim().length === 0) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 });
  }

  await deleteSearchById(id);
  return NextResponse.json({ ok: true });
}
