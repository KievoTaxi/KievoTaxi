import { NextResponse } from "next/server";
import { createSignedQuote } from "../../../lib/quote";

type RideTimeType = "now" | "later";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, "").trim() : "";
}

function normalizePeopleCount(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "1";
}

function calculatePrice(distanceKm: number) {
  const baseFare = 9;
  const perKm = 2.8;
  const minimumFare = 18;

  const raw = baseFare + distanceKm * perKm;
  return Math.max(minimumFare, Math.round(raw));
}

function buildValidUntil(rideTimeType: RideTimeType, rideTime: string) {
  const now = Date.now();

  if (rideTimeType !== "later" || !rideTime) {
    return now + 30 * 60 * 1000;
  }

  const [hoursStr, minutesStr] = rideTime.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return now + 30 * 60 * 1000;
  }

  const pickupDate = new Date();
  pickupDate.setHours(hours, minutes, 0, 0);

  if (pickupDate.getTime() < now) {
    pickupDate.setDate(pickupDate.getDate() + 1);
  }

  return pickupDate.getTime() + 6 * 60 * 60 * 1000;
}

async function reverseGeocode(lat: number, lng: number, apiKey: string) {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?latlng=${encodeURIComponent(`${lat},${lng}`)}` +
    `&language=pl&region=pl&key=${apiKey}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Nie udało się pobrać adresu z lokalizacji.");
  }

  const data = await res.json();
  const address = data?.results?.[0]?.formatted_address;

  if (!address) {
    throw new Error("Nie udało się ustalić adresu.");
  }

  return address;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!mapsApiKey) {
      return NextResponse.json(
        { error: "Brak GOOGLE_MAPS_API_KEY w env." },
        { status: 500 }
      );
    }

    if (body?.geocodeOnly === true) {
      const lat = Number(body?.lat);
      const lng = Number(body?.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json(
          { error: "Nieprawidłowe współrzędne lokalizacji." },
          { status: 400 }
        );
      }

      const address = await reverseGeocode(lat, lng, mapsApiKey);

      return NextResponse.json({ address });
    }

    const from = normalizeText(body?.from);
    const to = normalizeText(body?.to);
    const name = normalizeText(body?.name);
    const phone = normalizePhone(body?.phone);
    const peopleCount = normalizePeopleCount(body?.peopleCount);
    const rideTimeType: RideTimeType =
      body?.rideTimeType === "later" ? "later" : "now";
    const rideTime = normalizeText(body?.rideTime);

    if (!from || !to) {
      return NextResponse.json(
        { error: "Uzupełnij adres początkowy i docelowy." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Uzupełnij imię." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Uzupełnij numer telefonu." },
        { status: 400 }
      );
    }

    if (phone.length < 9) {
      return NextResponse.json(
        { error: "Wpisz poprawny numer telefonu." },
        { status: 400 }
      );
    }

    if (rideTimeType === "later" && !rideTime) {
      return NextResponse.json(
        { error: "Wybierz godzinę odbioru." },
        { status: 400 }
      );
    }

    const url =
      "https://maps.googleapis.com/maps/api/distancematrix/json" +
      `?origins=${encodeURIComponent(from)}` +
      `&destinations=${encodeURIComponent(to)}` +
      `&mode=driving&language=pl&region=pl&units=metric` +
      `&key=${mapsApiKey}`;

    const distanceRes = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!distanceRes.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać dystansu trasy." },
        { status: 502 }
      );
    }

    const distanceData = await distanceRes.json();
    const element = distanceData?.rows?.[0]?.elements?.[0];
    const distanceMeters = element?.distance?.value;

    if (
      element?.status !== "OK" ||
      typeof distanceMeters !== "number" ||
      distanceMeters <= 0
    ) {
      return NextResponse.json(
        { error: "Nie udało się wyznaczyć trasy." },
        { status: 400 }
      );
    }

    const distanceKm = Number((distanceMeters / 1000).toFixed(1));
    const price = calculatePrice(distanceKm);
    const createdAt = Date.now();
    const expiresAt = buildValidUntil(rideTimeType, rideTime);

    const payload = {
      from,
      to,
      name,
      phone,
      peopleCount,
      rideTimeType,
      rideTime,
      distanceKm,
      price,
      createdAt,
      expiresAt,
    };

    const { token, quoteCode } = createSignedQuote(payload);

    return NextResponse.json({
      distance: distanceKm,
      price,
      token,
      quoteCode,
      validUntil: expiresAt,
    });
  } catch (error) {
    console.error("Quote API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wewnętrzny błąd serwera.",
      },
      { status: 500 }
    );
  }
}