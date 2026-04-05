export async function POST(req: Request) {
  try {
    const { from, to } = await req.json();

    if (!from || !to) {
      return Response.json({ error: "Brak adresu startowego lub docelowego" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Brak klucza API Google Maps" }, { status: 500 });
    }

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(from)}` +
      `&destinations=${encodeURIComponent(to)}` +
      `&language=pl` +
      `&region=pl` +
      `&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return Response.json({ error: "Błąd Google Maps API" }, { status: 500 });
    }

    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return Response.json({ error: "Nie znaleziono trasy" }, { status: 400 });
    }

    const distanceKm = element.distance.value / 1000;

    const price = Math.round(7 + distanceKm * 2.8);

    return Response.json({
      distance: distanceKm,
      price,
    });
  } catch {
    return Response.json({ error: "Błąd serwera" }, { status: 500 });
  }
}