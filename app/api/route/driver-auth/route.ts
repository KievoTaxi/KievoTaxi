import {
  createDriverSession,
  DRIVER_SESSION_COOKIE,
  verifyDriverPassword,
} from "../../../lib/driverAuth";

const attempts = new Map<
  string,
  { count: number; firstAttemptAt: number; blockedUntil: number }
>();

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function getRateLimitState(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);

  if (!current) {
    return {
      count: 0,
      firstAttemptAt: now,
      blockedUntil: 0,
    };
  }

  if (current.blockedUntil > now) {
    return current;
  }

  if (now - current.firstAttemptAt > 15 * 60 * 1000) {
    const reset = {
      count: 0,
      firstAttemptAt: now,
      blockedUntil: 0,
    };
    attempts.set(ip, reset);
    return reset;
  }

  return current;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const state = getRateLimitState(ip);
    const now = Date.now();

    if (state.blockedUntil > now) {
      return Response.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie później." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const password = String(body.password || "");

    if (!password) {
      return Response.json(
        { error: "Wpisz hasło." },
        { status: 400 }
      );
    }

    const isValid = verifyDriverPassword(password);

    if (!isValid) {
      const nextCount = state.count + 1;
      const blockedUntil = nextCount >= 5 ? now + 15 * 60 * 1000 : 0;

      attempts.set(ip, {
        count: nextCount,
        firstAttemptAt: state.firstAttemptAt || now,
        blockedUntil,
      });

      return Response.json(
        {
          error:
            blockedUntil > 0
              ? "Zbyt wiele prób. Spróbuj ponownie za 15 minut."
              : "Nieprawidłowe hasło.",
        },
        { status: blockedUntil > 0 ? 429 : 401 }
      );
    }

    attempts.delete(ip);

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
    console.error("API /api/driver-auth error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wewnętrzny błąd serwera",
      },
      { status: 500 }
    );
  }
}