import { NextResponse } from "next/server";
import {
  createBackofficeSessionValue,
  getSessionCookieName,
  validateBackofficeCredentials
} from "@/lib/backoffice-auth";

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const login = body?.login?.trim() ?? "";
  const password = body?.password ?? "";

  if (!validateBackofficeCredentials(login, password)) {
    return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), createBackofficeSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
