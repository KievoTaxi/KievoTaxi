import { NextResponse } from "next/server";
import {
  createDriverSession,
  DRIVER_SESSION_COOKIE,
  verifyDriverPassword,
} from "../../../lib/driverAuth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dni

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!password) {
      return NextResponse.json(
        { error: "Wpisz hasło." },
        { status: 400 }
      );
    }

    const isValid = verifyDriverPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Nieprawidłowe hasło." },
        { status: 401 }
      );
    }

    const session = createDriverSession(30);

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: DRIVER_SESSION_COOKIE,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Driver auth error:", error);

    return NextResponse.json(
      { error: "Błąd serwera." },
      { status: 500 }
    );
  }
}