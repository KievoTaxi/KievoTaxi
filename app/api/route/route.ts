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

      const geocodeUrl =
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pl&key=${apiKey}`;

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

    const { from, to } = body;

    if (!from || !to) {
      return Response.json(
        { error: "Brak adresu startowego lub docelowego" },
        { status: 400 }
      );
    }

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
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

    const baseFare = 8;
    const perKm = 3;

    const finalPrice = Math.round(baseFare + distanceKm * perKm);

    return Response.json({
      distance: distanceKm,
      price: finalPrice,
    });
  } catch {
    return Response.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}