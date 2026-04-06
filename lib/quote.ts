import crypto from "crypto";

export type QuotePayload = {
  from: string;
  to: string;
  name: string;
  phone: string;
  peopleCount: string;
  rideTimeType: "now" | "later";
  rideTime: string;
  distanceKm: number;
  price: number;
  createdAt: number;
  expiresAt: number;
};

function getQuoteSecret() {
  const secret = process.env.QUOTE_SECRET;
  if (!secret) {
    throw new Error("Brak QUOTE_SECRET w env");
  }
  return secret;
}

function toBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function sign(data: string) {
  return crypto
    .createHmac("sha256", getQuoteSecret())
    .update(data)
    .digest("hex");
}

export function createSignedQuote(payload: QuotePayload) {
  const json = JSON.stringify(payload);
  const payloadPart = toBase64Url(json);
  const signature = sign(payloadPart);
  const token = `${payloadPart}.${signature}`;
  const quoteCode = `KT-${signature.slice(0, 8).toUpperCase()}`;

  return {
    token,
    quoteCode,
  };
}

export function verifySignedQuote(token: string): QuotePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadPart, signature] = parts;
  const expected = sign(payloadPart);

  if (signature !== expected) return null;

  try {
    const json = fromBase64Url(payloadPart);
    return JSON.parse(json) as QuotePayload;
  } catch {
    return null;
  }
}

export function isQuoteExpired(payload: QuotePayload) {
  return Date.now() > payload.expiresAt;
}