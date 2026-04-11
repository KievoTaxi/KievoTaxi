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

    try {
      setLoading(true);
      setStatusText("Liczenie ceny...");

      const res = await fetch("/api/quote", {
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
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    const message = `Dzień dobry, proszę o zamówienie przejazdu.

Kod: ${quoteCode}
Link: ${quoteLink}

Imię: ${name}
Telefon: ${phone}

Trasa:
${from} → ${to}

Cena: ${price}`;

    const url = `https://wa.me/48700111222?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  return (
    <div style={wrapper}>
      <div style={card}>
        <h2 style={title}>KievoTaxi</h2>

        <input
          placeholder="np. Rzeszów, ul. Rejtana 23"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={input}
        />

        <input
          placeholder="np. Lotnisko Kraków"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={input}
        />

        <input
          placeholder="np. Adam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        <input
          placeholder="np. 700 111 222"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={input}
        />

        <button onClick={handleQuote} style={button}>
          {loading ? "Liczenie..." : "Oblicz cenę"}
        </button>

        {error && <div style={errorStyle}>{error}</div>}
        {statusText && <div style={status}>{statusText}</div>}

        {price && (
          <div style={result}>
            <p>Dystans: {distance}</p>
            <p>Cena: {price}</p>
            <p>Kod: {quoteCode}</p>

            <button onClick={handleWhatsAppOrder} style={whatsapp}>
              Zamów przez WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const wrapper: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0b0b0b",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "#161616",
  padding: "24px",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const title: React.CSSProperties = {
  color: "#fff",
  fontSize: "24px",
};

const input: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #333",
  background: "#222",
  color: "#fff",
};

const button: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "#7CFF5B",
  border: "none",
  fontWeight: 700,
};

const whatsapp: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "#25D366",
  border: "none",
  color: "#fff",
  fontWeight: 700,
};

const result: React.CSSProperties = {
  marginTop: "10px",
  color: "#fff",
};

const errorStyle: React.CSSProperties = {
  color: "#f87171",
};

const status: React.CSSProperties = {
  color: "#aaa",
};