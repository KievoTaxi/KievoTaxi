import { createSignedQuote } from "@/lib/quote";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Brak klucza API Google Maps" },
        { status: 500 }
      );
    }

    if (body.geocodeOnly) {
      const { lat, lng } = body;

      if (typeof lat !== "number" || typeof lng !== "number") {
        return Response.json(
          { error: "Nieprawidłowe współrzędne lokalizacji" },
          { status: 400 }
        );
      }

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pl&key=${apiKey}`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();

      if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
        return Response.json(
          { error: "Nie udało się odczytać adresu z lokalizacji" },
          { status: 400 }
        );
      }

      const address = geocodeData.results[0].formatted_address;
      return Response.json({ address });
    }

    const {
      from,
      to,
      name,
      phone,
      peopleCount,
      rideTimeType,
      rideTime,
    } = body;

    if (!from || !to || !name || !phone || !peopleCount || !rideTimeType) {
      return Response.json(
        { error: "Brakuje wymaganych danych do wyceny." },
        { status: 400 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      from
    )}&destinations=${encodeURIComponent(
      to
    )}&mode=driving&language=pl&units=metric&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return Response.json(
        { error: "Błąd Google Maps API" },
        { status: 400 }
      );
    }

    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return Response.json(
        { error: "Nie znaleziono trasy dla podanych adresów" },
        { status: 400 }
      );
    }

    const distanceKm = element.distance.value / 1000;

    if (distanceKm < 1) {
      return Response.json(
        { error: "Minimalny dystans przejazdu to 1 km." },
        { status: 400 }
      );
    }

    if (distanceKm > 300) {
      return Response.json(
        { error: "Maksymalny dystans przejazdu to 300 km." },
        { status: 400 }
      );
    }

    let pricePerKm = 0;

    if (distanceKm <= 10) {
      pricePerKm = 3.2;
    } else if (distanceKm <= 50) {
      pricePerKm = 2.9;
    } else {
      pricePerKm = 2.5;
    }

    const baseFare = 8;
    const finalPrice = Math.round(baseFare + distanceKm * pricePerKm);

    const payload = {
      from,
      to,
      name,
      phone,
      peopleCount,
      rideTimeType,
      rideTime: rideTime || "",
      distanceKm,
      price: finalPrice,
      createdAt: Date.now(),
    };

    const { token, quoteCode } = createSignedQuote(payload);

    return Response.json({
      distance: Number(distanceKm.toFixed(1)),
      price: finalPrice,
      token,
      quoteCode,
    });
  } catch {
    return Response.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}