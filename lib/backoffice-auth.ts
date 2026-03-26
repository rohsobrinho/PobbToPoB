import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE_NAME = "backoffice_session";

function getRequiredEnv(name: "BACKOFFICE_LOGIN" | "BACKOFFICE_PASSWORD" | "BACKOFFICE_SESSION_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} nao configurado.`);
  }

  return value;
}

export function getBackofficeLogin() {
  return getRequiredEnv("BACKOFFICE_LOGIN");
}

export function validateBackofficeCredentials(login: string, password: string) {
  const expectedLogin = getBackofficeLogin();
  const expectedPassword = getRequiredEnv("BACKOFFICE_PASSWORD");

  return login === expectedLogin && password === expectedPassword;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function createBackofficeSessionValue() {
  const login = getBackofficeLogin();
  const secret = getRequiredEnv("BACKOFFICE_SESSION_SECRET");
  const signature = createHmac("sha256", secret).update(login).digest("hex");
  return `${login}.${signature}`;
}

export function isValidBackofficeSession(value: string | undefined) {
  if (!value) {
    return false;
  }

  const [login, signature] = value.split(".");
  if (!login || !signature) {
    return false;
  }

  const expectedLogin = getBackofficeLogin();
  if (login !== expectedLogin) {
    return false;
  }

  const expectedValue = createBackofficeSessionValue();
  const expectedBuffer = Buffer.from(expectedValue);
  const receivedBuffer = Buffer.from(value);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
