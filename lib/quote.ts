import crypto from "crypto";

export type RideTimeType = "now" | "later";

export type QuotePayload = {
  from: string;
  to: string;
  name: string;
  phone: string;
  peopleCount: string;
  rideTimeType: RideTimeType;
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
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string) {
  return crypto
    .createHmac("sha256", getQuoteSecret())
    .update(data)
    .digest("hex");
}

export function createSignedQuote(payload: QuotePayload) {
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadPart);
  const token = `${payloadPart}.${signature}`;
  const quoteCode = `KT-${signature.slice(0, 8).toUpperCase()}`;

  return { token, quoteCode };
}

export function verifySignedQuote(token: string): QuotePayload | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadPart, signature] = parts;

  if (!payloadPart || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadPart);

  const signatureBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");

  if (signatureBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = fromBase64Url(payloadPart);
    const payload = JSON.parse(json) as QuotePayload;

    if (
      !payload ||
      typeof payload.from !== "string" ||
      typeof payload.to !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.peopleCount !== "string" ||
      (payload.rideTimeType !== "now" && payload.rideTimeType !== "later") ||
      typeof payload.rideTime !== "string" ||
      typeof payload.distanceKm !== "number" ||
      typeof payload.price !== "number" ||
      typeof payload.createdAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isQuoteExpired(payload: QuotePayload) {
  return Date.now() > payload.expiresAt;
}