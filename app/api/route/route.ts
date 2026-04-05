export async function POST(req: Request) {
  const { from, to } = await req.json();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${from}&destinations=${to}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    return Response.json({ error: "Błąd API" });
  }

  const element = data.rows[0].elements[0];

  if (element.status !== "OK") {
    return Response.json({ error: "Nie znaleziono trasy" });
  }

  const distanceKm = element.distance.value / 1000;

  const price = 8 + distanceKm * 3;

  return Response.json({
    distance: distanceKm,
    price: Math.round(price),
  });
}