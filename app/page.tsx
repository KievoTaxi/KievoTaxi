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
  const [quoteCode, setQuoteCode] = useState("");
  const [quoteLink, setQuoteLink] = useState("");

  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "");
  }

  function isValidPhone(value: string) {
    return normalizePhone(value).length >= 9;
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

      const res = await fetch("/api/quote", { // ✅ POPRAWIONE
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
    setQuoteCode("");
    setQuoteLink("");
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

      const res = await fetch("/api/quote", { // ✅ POPRAWIONE
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          name,
          phone: normalizePhone(phone),
          peopleCount,
          rideTimeType,
          rideTime,
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
      setQuoteCode(data.quoteCode);

      const verifyUrl = `${window.location.origin}/verify?token=${encodeURIComponent(
        data.token
      )}`;

      setQuoteLink(verifyUrl);
      setStatusText("Wycena gotowa.");
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
      setStatusText("");
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (!distance || !price || !quoteCode || !quoteLink) {
      setError("Najpierw oblicz cenę.");
      return;
    }

    const pickupTime =
      rideTimeType === "now" ? "Jak najszybciej" : rideTime.trim();

    const cleanPhone = normalizePhone(phone);

    const message = `Dzień dobry, proszę o zamówienie przejazdu.

Kod wyceny:
${quoteCode}

Link weryfikacyjny:
${quoteLink}

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

Kierowca weryfikuje cenę i trasę wyłącznie przez link systemowy.`;

    const url = `https://wa.me/48700111222?text=${encodeURIComponent(message)}`; // ✅ LOSOWY NUMER

    setStatusText("Przekierowuję do WhatsApp...");
    window.open(url, "_blank");
  }

  return (
    <div style={{ padding: "20px", maxWidth: "420px", margin: "0 auto" }}>
      <h2>KievoTaxi</h2>

      <input placeholder="Adres startowy" value={from} onChange={(e) => setFrom(e.target.value)} />
      <button onClick={handleUseMyLocation}>Użyj mojej lokalizacji</button>

      <input placeholder="Adres docelowy" value={to} onChange={(e) => setTo(e.target.value)} />

      <input placeholder="Imię (np. Adam)" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Telefon (np. 700 111 222)" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <button onClick={handleQuote}>Oblicz cenę</button>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {statusText && <div>{statusText}</div>}

      {price && (
        <div>
          <p>Dystans: {distance}</p>
          <p>Cena: {price}</p>
          <p>Kod: {quoteCode}</p>
          <button onClick={handleWhatsAppOrder}>Zamów</button>
        </div>
      )}
    </div>
  );
}