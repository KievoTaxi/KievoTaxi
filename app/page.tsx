"use client";

import { useState } from "react";

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ from, to }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setDistance(`${Number(data.distance).toFixed(1)} km`);
      setPrice(`${data.price} zł`);
    } catch {
      setError("Coś poszło nie tak");
    } finally {
      setLoading(false);
    }
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "rgba(0,0,0,0.72)",
          borderRadius: "18px",
          padding: "28px",
          color: "#ffffff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
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
              color: "rgba(255,255,255,0.8)",
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
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Adres startowy
          </label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="np. Rzeszów, ul. Rejtana 23"
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
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Adres docelowy
          </label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="np. Lotnisko Kraków Balice"
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
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "none",
            background: "#16a34a",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Liczenie..." : "Oblicz cenę"}
        </button>

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
          </div>
        )}
      </div>
    </div>
  );
}