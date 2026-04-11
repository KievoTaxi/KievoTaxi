import { cookies } from "next/headers";
import { DRIVER_SESSION_COOKIE } from "../../../../lib/driverAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    const correctPassword = process.env.DRIVER_ACCESS_PASSWORD;

    if (!correctPassword) {
      return Response.json(
        { error: "Brak DRIVER_ACCESS_PASSWORD w env." },
        { status: 500 }
      );
    }

    if (!password) {
      return Response.json({ error: "Wpisz hasło." }, { status: 400 });
    }

    if (password !== correctPassword) {
      return Response.json({ error: "Złe hasło." }, { status: 401 });
    }

    const cookieStore = await cookies();

    cookieStore.set(DRIVER_SESSION_COOKIE, "driver-ok", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Błąd serwera." }, { status: 500 });
  }
}