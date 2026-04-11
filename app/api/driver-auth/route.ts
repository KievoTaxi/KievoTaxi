import {
  createDriverSession,
  DRIVER_SESSION_COOKIE,
  verifyDriverPassword,
} from "../../../lib/driverAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");

    if (!password) {
      return Response.json({ error: "Wpisz hasło." }, { status: 400 });
    }

    const isValid = verifyDriverPassword(password);

    if (!isValid) {
      return Response.json(
        { error: "Nieprawidłowe hasło." },
        { status: 401 }
      );
    }

    const session = createDriverSession(30);

    const response = Response.json({ ok: true });

    response.headers.append(
      "Set-Cookie",
      `${DRIVER_SESSION_COOKIE}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 30
      }; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
    );

    return response;
  } catch (error) {
    console.error("Driver auth error:", error);

    return Response.json(
      { error: "Błąd serwera." },
      { status: 500 }
    );
  }
}