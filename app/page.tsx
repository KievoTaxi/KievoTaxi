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

      const res = await fetch("/api/quote", {
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
        setError(data.error || "Nie udało się pobrać Twojej lokalizacji.");
        return;
      }

      setFrom(data.address || `${lat}, ${lng}`);
      setStatusText("Adres startowy został uzupełniony.");
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

Kierowca weryfikuje trasę i cenę przez link systemowy.`;

    const url = `https://wa.me/48700111222?text=${encodeURIComponent(message)}`;

    setStatusText("Przekierowuję do WhatsApp...");
    window.open(url, "_blank");
  }

  return (
    <main style={styles.page}>
      <div style={styles.pageOverlay} />

      <section style={styles.shell}>
        <div style={styles.heroCard}>
          <img
            src="/toyota-hero.jpg"
            alt="KievoTaxi"
            style={styles.heroImage}
          />

          <div style={styles.heroOverlay}>
            <div style={styles.heroBadge}>Prywatny przejazd • szybka wycena</div>

            <h1 style={styles.heroTitle}>
              Twój prywatny przejazd.
              <br />
              Bez komplikacji.
            </h1>

            <p style={styles.heroSubtitle}>
              Stała cena. Bez niespodzianek.
            </p>

            <div style={styles.heroList}>
              <div style={styles.heroListItem}>✔ Komfortowy i sprawdzony kierowca</div>
              <div style={styles.heroListItem}>✔ Przejrzysta cena przed startem</div>
              <div style={styles.heroListItem}>✔ Bezpieczny przejazd o każdej porze</div>
            </div>
          </div>
        </div>

        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Oblicz cenę przejazdu</h2>
            <p style={styles.formSubtitle}>
              Wpisz dokładny adres startowy i docelowy, żeby wycena była możliwie
              precyzyjna.
            </p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Adres startowy</label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="np. Rzeszów, ul. Rejtana 23"
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              style={{
                ...styles.secondaryButton,
                opacity: locating ? 0.75 : 1,
                cursor: locating ? "default" : "pointer",
              }}
            >
              {locating ? "Pobieranie lokalizacji..." : "📍 Użyj mojej lokalizacji"}
            </button>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Adres docelowy</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="np. Lotnisko Kraków Balice"
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Liczba osób</label>
            <select
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              style={styles.input}
            >
              <option value="1" style={styles.option}>
                1 osoba
              </option>
              <option value="2" style={styles.option}>
                2 osoby
              </option>
              <option value="3" style={styles.option}>
                3 osoby
              </option>
              <option value="4" style={styles.option}>
                4 osoby
              </option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Czas odbioru</label>

            <div style={styles.timeGrid}>
              <button
                type="button"
                onClick={() => {
                  setRideTimeType("now");
                  setRideTime("");
                  setError("");
                }}
                style={{
                  ...styles.timeButton,
                  ...(rideTimeType === "now"
                    ? styles.timeButtonActive
                    : styles.timeButtonInactive),
                }}
              >
                Jak najszybciej
              </button>

              <button
                type="button"
                onClick={() => {
                  setRideTimeType("later");
                  setError("");
                }}
                style={{
                  ...styles.timeButton,
                  ...(rideTimeType === "later"
                    ? styles.timeButtonActive
                    : styles.timeButtonInactive),
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
                spellCheck={false}
                style={{ ...styles.input, marginTop: "12px" }}
              />
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Imię</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Julia"
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Numer telefonu</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="np. 700 111 222"
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
          </div>

          <button
            type="button"
            onClick={handleQuote}
            disabled={loading || locating}
            style={{
              ...styles.primaryButton,
              opacity: loading || locating ? 0.75 : 1,
              cursor: loading || locating ? "default" : "pointer",
            }}
          >
            {loading ? "Liczenie..." : "Oblicz cenę"}
          </button>

          {statusText && <div style={styles.status}>{statusText}</div>}
          {error && <div style={styles.error}>{error}</div>}

          {(distance || price) && !error && (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.resultLabel}>Szacowana cena</div>
                  <div style={styles.resultPrice}>{price}</div>
                </div>

                <div style={styles.resultDistance}>{distance}</div>
              </div>

              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.resultItemLabel}>Odbiór</span>
                  <strong>
                    {rideTimeType === "now" ? "Jak najszybciej" : rideTime}
                  </strong>
                </div>

                <div style={styles.resultItem}>
                  <span style={styles.resultItemLabel}>Liczba osób</span>
                  <strong>{peopleCount}</strong>
                </div>

                <div style={styles.resultItemWide}>
                  <span style={styles.resultItemLabel}>Kod wyceny</span>
                  <strong>{quoteCode}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                style={styles.whatsAppButton}
              >
                Zamów przejazd
              </button>

              <div style={styles.smallText}>
                Po kliknięciu otworzy się WhatsApp z gotową wiadomością.
                Kierowca potwierdza kurs na podstawie kodu i linku systemowego.
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    background: "#040404",
    overflow: "hidden",
  },
  pageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(124,255,91,0.08), transparent 28%), linear-gradient(180deg, rgba(0,0,0,0.40), rgba(0,0,0,0.80))",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "28px 16px 40px",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
  },
  heroCard: {
    position: "relative",
    minHeight: "640px",
    maxWidth: "420px",
    width: "100%",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
    justifySelf: "start",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.58) 45%, rgba(0,0,0,0.78) 100%)",
    color: "#fff",
    boxSizing: "border-box",
  },
  heroBadge: {
    alignSelf: "flex-start",
    display: "inline-block",
    padding: "9px 14px",
    borderRadius: "999px",
    background: "rgba(124,255,91,0.12)",
    border: "1px solid rgba(124,255,91,0.22)",
    color: "#d1ffc4",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "18px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "48px",
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
    fontWeight: 900,
    maxWidth: "320px",
  },
  heroSubtitle: {
    marginTop: "18px",
    marginBottom: "22px",
    fontSize: "19px",
    lineHeight: 1.4,
    color: "rgba(255,255,255,0.92)",
    fontWeight: 700,
  },
  heroList: {
    display: "grid",
    gap: "14px",
    fontSize: "15px",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.94)",
    maxWidth: "320px",
  },
  heroListItem: {
    textShadow: "0 2px 12px rgba(0,0,0,0.35)",
  },
  formCard: {
    width: "100%",
    maxWidth: "520px",
    background: "rgba(12,12,12,0.78)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    color: "#fff",
    boxSizing: "border-box",
    boxShadow: "0 24px 70px rgba(0,0,0,0.36)",
    backdropFilter: "blur(12px)",
    justifySelf: "end",
  },
  formHeader: {
    marginBottom: "18px",
  },
  formTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 900,
    lineHeight: 1.1,
  },
  formSubtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  field: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "rgba(255,255,255,0.96)",
    fontSize: "14px",
    fontWeight: 800,
  },
  input: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  },
  option: {
    color: "#111",
  },
  secondaryButton: {
    width: "100%",
    marginTop: "10px",
    padding: "13px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 800,
    boxSizing: "border-box",
  },
  timeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  timeButton: {
    minHeight: "96px",
    padding: "14px 12px",
    borderRadius: "18px",
    fontSize: "15px",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.3,
  },
  timeButtonActive: {
    border: "2px solid #7CFF5B",
    background: "rgba(124,255,91,0.16)",
    boxShadow: "0 0 0 1px rgba(124,255,91,0.06) inset",
  },
  timeButtonInactive: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
  },
  primaryButton: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(180deg, #96ff6c 0%, #7CFF5B 100%)",
    color: "#111",
    fontSize: "18px",
    fontWeight: 900,
    boxSizing: "border-box",
    boxShadow: "0 14px 34px rgba(124,255,91,0.18)",
  },
  status: {
    marginTop: "14px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.74)",
    lineHeight: 1.5,
  },
  error: {
    marginTop: "14px",
    fontSize: "14px",
    color: "#ff9b9b",
    lineHeight: 1.5,
  },
  resultCard: {
    marginTop: "22px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "12px",
    marginBottom: "18px",
  },
  resultLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.68)",
    marginBottom: "4px",
  },
  resultPrice: {
    fontSize: "34px",
    fontWeight: 900,
    lineHeight: 1,
  },
  resultDistance: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(124,255,91,0.14)",
    border: "1px solid rgba(124,255,91,0.20)",
    color: "#cfffbe",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  resultItem: {
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    lineHeight: 1.45,
  },
  resultItemWide: {
    gridColumn: "1 / -1",
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    lineHeight: 1.45,
  },
  resultItemLabel: {
    display: "block",
    fontSize: "12px",
    color: "rgba(255,255,255,0.64)",
    marginBottom: "4px",
  },
  whatsAppButton: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "15px",
    border: "none",
    background: "linear-gradient(180deg, #2dde72 0%, #25D366 100%)",
    color: "#fff",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
    boxSizing: "border-box",
  },
  smallText: {
    marginTop: "10px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.55,
  },
};