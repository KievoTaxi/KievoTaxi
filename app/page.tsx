"use client";

import { useState } from "react";

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState("1");

  const [rideTimeType, setRideTimeType] = useState<"now" | "later">("now");
  const [rideTime, setRideTime] = useState("");

  const [distance, setDistance] = useState("");
  const [price, setPrice] = useState("");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "");
  }

  function isValidPhone(value: string) {
    const digits = normalizePhone(value);
    return digits.length >= 9;
  }

  async function handleUseMyLocation() {
    setError("");
    setStatusText("");

    if (!navigator.geolocation) {
      setError("Ta przeglądarka nie obsługuje lokalizacji.");
      return;
    }

    try {
      setLocating(true);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const res = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geocodeOnly: true,
          lat,
          lng,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Nie udało się pobrać lokalizacji.");
        return;
      }

      setFrom(data.address || `${lat}, ${lng}`);
    } catch {
      setError("Nie udało się pobrać Twojej lokalizacji.");
    } finally {
      setLocating(false);
    }
  }

  async function handleQuote() {
    setError("");
    setDistance("");
    setPrice("");
    setStatusText("");

    if (!from.trim() || !to.trim()) {
      setError("Wpisz adres startowy i docelowy.");
      return;
    }

    if (!name.trim()) {
      setError("Wpisz imię.");
      return;
    }

    if (!phone.trim()) {
      setError("Wpisz numer telefonu.");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Wpisz poprawny numer telefonu.");
      return;
    }

    if (rideTimeType === "later" && !rideTime.trim()) {
      setError("Wpisz godzinę odbioru, np. 21:30.");
      return;
    }

    try {
      setLoading(true);
      setStatusText("Liczenie ceny...");

      const res = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Nie udało się obliczyć ceny.");
        setStatusText("");
        return;
      }

      setDistance(`${Number(data.distance).toFixed(1)} km`);
      setPrice(`${data.price} zł`);
      setStatusText("Wycena gotowa.");
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
      setStatusText("");
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (!distance || !price) {
      setError("Najpierw oblicz cenę.");
      return;
    }

    if (!name.trim()) {
      setError("Wpisz imię.");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Wpisz poprawny numer telefonu.");
      return;
    }

    const pickupTime =
      rideTimeType === "now" ? "Jak najszybciej" : rideTime.trim();

    const cleanPhone = normalizePhone(phone);

    const message = `Dzień dobry, proszę o zamówienie przejazdu.

Imię:
${name}

Telefon:
${cleanPhone}

Liczba osób:
${peopleCount}

Trasa:
${from} → ${to}

Czas odbioru:
${pickupTime}

Szacowany dystans:
${distance}

Szacowana cena:
${price}

Cena obowiązuje po potwierdzeniu przez kierowcę.`;

    const url = `https://wa.me/48578000637?text=${encodeURIComponent(message)}`;

    setStatusText("Przekierowuję do WhatsApp...");
    window.open(url, "_blank");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(10,10,10,0.78), rgba(10,10,10,0.88)), url('/toyota.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(0,0,0,0.72)",
          borderRadius: "18px",
          padding: "28px",
          color: "#ffffff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            KievoTaxi
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.5,
            }}
          >
            Szybka wycena przejazdu. Podaj dokładne adresy, żeby cena była
            możliwie precyzyjna.
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Adres startowy
          </label>

          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="np. Rzeszów, ul. Rejtana 23"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "10px",
            }}
          />

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: locating ? "default" : "pointer",
              boxSizing: "border-box",
              opacity: locating ? 0.75 : 1,
            }}
          >
            {locating ? "Pobieranie lokalizacji..." : "📍 Użyj mojej lokalizacji"}
          </button>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Adres docelowy
          </label>

          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="np. Lotnisko Kraków Balice"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Liczba osób
          </label>

          <select
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="1" style={{ color: "#000" }}>1 osoba</option>
            <option value="2" style={{ color: "#000" }}>2 osoby</option>
            <option value="3" style={{ color: "#000" }}>3 osoby</option>
            <option value="4" style={{ color: "#000" }}>4 osoby</option>
          </select>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Czas odbioru
          </label>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              type="button"
              onClick={() => {
                setRideTimeType("now");
                setRideTime("");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border:
                  rideTimeType === "now"
                    ? "2px solid #7CFF5B"
                    : "1px solid rgba(255,255,255,0.15)",
                background:
                  rideTimeType === "now"
                    ? "rgba(124,255,91,0.14)"
                    : "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Jak najszybciej
            </button>

            <button
              type="button"
              onClick={() => {
                setRideTimeType("later");
                setRideTime("");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border:
                  rideTimeType === "later"
                    ? "2px solid #7CFF5B"
                    : "1px solid rgba(255,255,255,0.15)",
                background:
                  rideTimeType === "later"
                    ? "rgba(124,255,91,0.14)"
                    : "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Na konkretną godzinę
            </button>
          </div>

          {rideTimeType === "later" && (
            <input
              type="text"
              value={rideTime}
              onChange={(e) => setRideTime(e.target.value)}
              placeholder="np. 21:30"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Imię
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Anna"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
            }}
          >
            Numer telefonu
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="np. 575 558 705"
            autoComplete="off"
            spellCheck={false}
            inputMode="tel"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleQuote}
          disabled={loading || locating}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "none",
            background: "#7CFF5B",
            color: "#111111",
            fontSize: "16px",
            fontWeight: 700,
            cursor: loading || locating ? "default" : "pointer",
            boxSizing: "border-box",
            opacity: loading || locating ? 0.75 : 1,
          }}
        >
          {loading ? "Liczenie..." : "Oblicz cenę"}
        </button>

        {statusText && (
          <div
            style={{
              marginTop: "14px",
              color: "rgba(255,255,255,0.82)",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {statusText}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "16px",
              color: "#fca5a5",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {(distance || price) && !error && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: "15px", marginBottom: "8px" }}>
              Dystans: <strong>{distance}</strong>
            </div>

            <div style={{ fontSize: "18px", fontWeight: 700 }}>
              Cena: {price}
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              Odbiór:{" "}
              <strong>
                {rideTimeType === "now" ? "Jak najszybciej" : rideTime}
              </strong>
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              Liczba osób: <strong>{peopleCount}</strong>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "none",
                background: "#25D366",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              Zamów przejazd
            </button>

            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.5,
              }}
            >
              Zamówienie potwierdzamy na WhatsApp po sprawdzeniu dostępności.
              Cena obowiązuje po potwierdzeniu przez kierowcę.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}