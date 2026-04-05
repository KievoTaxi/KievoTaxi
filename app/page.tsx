"use client";

import { useState } from "react";

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuote() {
    setError("");
    setDistance("");
    setPrice("");

    if (!from.trim() || !to.trim()) {
      setError("Wpisz adres startowy i docelowy");
      return;
    }

    try {
      setLoading(true);

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

      if (data.error) {
        setError(data.error);
        return;
      }

      setDistance(`${data.distance.toFixed(1)} km`);
      setPrice(`${data.price} zł`);
    } catch {
      setError("Coś poszło nie tak");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial", maxWidth: 500 }}>
      <h1>KievoTaxi</h1>

      <p>Adres startowy</p>
      <input
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="np. Tyczyn"
        style={{ padding: 10, width: "100%", marginBottom: 16 }}
      />

      <p>Adres docelowy</p>
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="np. Rzeszów"
        style={{ padding: 10, width: "100%", marginBottom: 16 }}
      />

      <button onClick={handleQuote} style={{ padding: 12, cursor: "pointer" }}>
        {loading ? "Liczenie..." : "Oblicz cenę"}
      </button>

      {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}

      {distance && <p style={{ marginTop: 20 }}>Dystans: {distance}</p>}
      {price && <p>Cena: {price}</p>}
    </div>
  );
}