import crypto from "crypto";

export const DRIVER_SESSION_COOKIE = "driver_session";

function getSessionSecret() {
  const secret = process.env.DRIVER_SESSION_SECRET;

  if (!secret) {
    throw new Error("Brak DRIVER_SESSION_SECRET w env");
  }

  return secret;
}

export function verifyDriverPassword(inputPassword: string) {
  const expectedPassword = process.env.DRIVER_ACCESS_PASSWORD;

  if (!expectedPassword) {
    throw new Error("Brak DRIVER_ACCESS_PASSWORD w env");
  }

  return inputPassword.trim() === expectedPassword.trim();
}

function sign(data: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("hex");
}

export function createDriverSession(days = 30) {
  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

  const payload = JSON.stringify({ expiresAt });
  const payloadBase64 = Buffer.from(payload).toString("base64url");

  const signature = sign(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

export function verifyDriverSession(token?: string | null) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;

  const expected = sign(payloadBase64);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length) return false;

  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const json = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const data = JSON.parse(json) as { expiresAt: number };

    return Date.now() < data.expiresAt;
  } catch {
    return false;
  }
}