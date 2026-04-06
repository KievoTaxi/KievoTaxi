"use client";

import { useState } from "react";

export default function DriverAccessForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Wpisz hasło.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/driver-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Błąd logowania.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Nie udało się zalogować.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Wpisz hasło dostępu"
        autoComplete="current-password"
        style={styles.input}
      />

      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? "Sprawdzanie..." : "Odblokuj dostęp"}
      </button>

      {error && <div style={styles.error}>{error}</div>}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "18px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#1e1e1e",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#7CFF5B",
    color: "#111",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    color: "#fca5a5",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};