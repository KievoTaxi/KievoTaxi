import crypto from "crypto";

export const DRIVER_SESSION_COOKIE = "driver_session";

type DriverSessionPayload = {
  role: "driver";
  iat: number;
  exp: number;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest();
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function getDriverPassword() {
  const password = process.env.DRIVER_ACCESS_PASSWORD;

  if (!password) {
    throw new Error("Brak DRIVER_ACCESS_PASSWORD w env");
  }

  return password;
}

function getDriverSessionSecret() {
  const secret = process.env.DRIVER_SESSION_SECRET;

  if (!secret) {
    throw new Error("Brak DRIVER_SESSION_SECRET w env");
  }

  return secret;
}

function sign(data: string) {
  return crypto
    .createHmac("sha256", getDriverSessionSecret())
    .update(data)
    .digest("hex");
}

export function verifyDriverPassword(inputPassword: string) {
  const expectedPassword = getDriverPassword();

  const inputHash = sha256(inputPassword);
  const expectedHash = sha256(expectedPassword);

  if (inputHash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputHash, expectedHash);
}

export function createDriverSession(days = 30) {
  const now = Date.now();

  const payload: DriverSessionPayload = {
    role: "driver",
    iat: now,
    exp: now + days * 24 * 60 * 60 * 1000,
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadPart);

  return `${payloadPart}.${signature}`;
}

export function verifyDriverSession(token?: string | null) {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadPart, signature] = parts;
    if (!payloadPart || !signature) return false;

    const expectedSignature = sign(payloadPart);

    const signatureBuf = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");

    if (signatureBuf.length !== expectedBuf.length) {
      return false;
    }

    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
      return false;
    }

    const payloadJson = fromBase64Url(payloadPart);
    const payload = JSON.parse(payloadJson) as DriverSessionPayload;

    if (!payload || payload.role !== "driver") {
      return false;
    }

    if (typeof payload.exp !== "number") {
      return false;
    }

    if (Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}