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
  const [statusLink, setStatusLink] = useState("");

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

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        setError(data?.error || "Nie udało się pobrać Twojej lokalizacji.");
        return;
      }

      setFrom(data?.address || `${lat}, ${lng}`);
      setStatusText("Adres startowy został uzupełniony.");
    } catch (err) {
      console.error("Location error:", err);
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
    setStatusLink("");
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
          saveOrder: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        setError(data?.error || "Nie udało się obliczyć ceny.");
        setStatusText("");
        return;
      }

      const finalDistance = `${Number(data.distance).toFixed(1)} km`;
      const finalPrice = `${data.price} zł`;
      const finalQuoteCode = data.quoteCode;

      setDistance(finalDistance);
      setPrice(finalPrice);
      setQuoteCode(finalQuoteCode);

      const verifyUrl = `${window.location.origin}/verify?token=${encodeURIComponent(
        data.token
      )}`;

      const passengerStatusUrl = `${window.location.origin}/status?code=${encodeURIComponent(
        finalQuoteCode
      )}`;

      setQuoteLink(verifyUrl);
      setStatusLink(passengerStatusUrl);
      setStatusText("Wycena gotowa.");
    } catch (err) {
      console.error("Quote error:", err);
      setError("Coś poszło nie tak. Spróbuj ponownie.");
      setStatusText("");
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (!distance || !price || !quoteCode || !quoteLink || !statusLink) {
      setError("Najpierw oblicz cenę.");
      return;
    }

    const pickupTime =
      rideTimeType === "now" ? "Jak najszybciej" : rideTime.trim();

    const cleanPhone = normalizePhone(phone);

    const message = `Dzień dobry, proszę o zamówienie przejazdu.

Kod wyceny:
${quoteCode}

Status dla klienta:
${statusLink}

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

Kierowca potwierdza kurs w systemie.`;

    const url = `https://wa.me/48578000637?text=${encodeURIComponent(message)}`;

    setStatusText("Przekierowuję do WhatsApp...");
    window.location.href = url;
  }

  return (
    <main style={styles.page}>
      <div style={styles.background} />
      <div style={styles.overlay} />

      <section style={styles.shell}>
        <div style={styles.heroTextBox}>
          <div style={styles.badge}>Prywatny przejazd • szybka wycena</div>

          <h1 style={styles.title}>
            Twój prywatny przejazd.
            <br />
            Bez komplikacji.
          </h1>

          <p style={styles.subtitle}>Stała cena. Bez niespodzianek.</p>

          <div style={styles.heroList}>
            <div style={styles.heroListItem}>
              <span style={styles.checkCircle}>✓</span>
              <span>Komfortowy i sprawdzony kierowca</span>
            </div>
            <div style={styles.heroListItem}>
              <span style={styles.checkCircle}>✓</span>
              <span>Przejrzysta cena przed startem</span>
            </div>
            <div style={styles.heroListItem}>
              <span style={styles.checkCircle}>✓</span>
              <span>Bezpieczny przejazd o każdej porze</span>
            </div>
          </div>
        </div>

        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Oblicz cenę przejazdu</h2>
          <p style={styles.formSubtitle}>
            Wpisz trasę, wybierz czas odbioru i zamów kurs po wycenie.
          </p>

          <div style={styles.fieldGroup}>
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

          <div style={styles.fieldGroup}>
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

          <div style={styles.fieldGroup}>
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

          <div style={styles.fieldGroup}>
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

          <div style={styles.fieldGroup}>
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

          <div style={styles.fieldGroup}>
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

                {statusLink && (
                  <div style={styles.resultItemWide}>
                    <span style={styles.resultItemLabel}>Panel pasażera</span>
                    <a
                      href={statusLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.resultLink}
                    >
                      Otwórz status przejazdu
                    </a>
                  </div>
                )}
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
    overflow: "hidden",
    background: "#050505",
  },
  background: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/toyota-hero.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.03)",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.52) 35%, rgba(0,0,0,0.74) 100%)",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    maxWidth: "560px",
    margin: "0 auto",
    padding: "26px 16px 40px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "22px",
  },
  heroTextBox: {
    color: "#fff",
    paddingTop: "10px",
  },
  badge: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(146,255,104,0.12)",
    border: "1px solid rgba(146,255,104,0.24)",
    color: "#d4ffc4",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "20px",
    backdropFilter: "blur(6px)",
  },
  title: {
    margin: 0,
    fontSize: "clamp(42px, 10vw, 68px)",
    lineHeight: 0.95,
    letterSpacing: "-0.045em",
    fontWeight: 900,
    maxWidth: "420px",
    textShadow: "0 8px 30px rgba(0,0,0,0.32)",
  },
  subtitle: {
    marginTop: "18px",
    marginBottom: "18px",
    fontSize: "clamp(18px, 4.6vw, 26px)",
    lineHeight: 1.35,
    fontWeight: 800,
    color: "#fff4e6",
    textShadow: "0 4px 18px rgba(0,0,0,0.28)",
  },
  heroList: {
    display: "grid",
    gap: "14px",
    maxWidth: "420px",
  },
  heroListItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "clamp(15px, 4vw, 19px)",
    lineHeight: 1.45,
    color: "rgba(255,245,232,0.97)",
    textShadow: "0 4px 16px rgba(0,0,0,0.22)",
  },
  checkCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,235,205,0.10)",
    border: "2px solid rgba(255,235,205,0.80)",
    color: "#fff6e7",
    fontWeight: 900,
    flexShrink: 0,
    boxSizing: "border-box",
  },
  formCard: {
    width: "100%",
    background: "rgba(8,8,8,0.72)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "24px",
    padding: "22px",
    color: "#ffffff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
    backdropFilter: "blur(12px)",
    boxSizing: "border-box",
  },
  formTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  formSubtitle: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.55,
    fontSize: "14px",
  },
  fieldGroup: {
    marginTop: "18px",
  },
  label: {
    display: "block",
    fontSize: "15px",
    marginBottom: "10px",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 800,
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    fontSize: "17px",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  option: {
    color: "#111111",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    boxSizing: "border-box",
    marginTop: "10px",
  },
  timeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  timeButton: {
    minHeight: "102px",
    padding: "14px",
    borderRadius: "18px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    lineHeight: 1.35,
  },
  timeButtonActive: {
    border: "2px solid #92ff68",
    background:
      "linear-gradient(180deg, rgba(146,255,104,0.18), rgba(146,255,104,0.08))",
    boxShadow: "0 0 0 1px rgba(146,255,104,0.06) inset",
  },
  timeButtonInactive: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
  },
  primaryButton: {
    width: "100%",
    marginTop: "18px",
    padding: "17px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(180deg, #9dff73 0%, #7cff5b 100%)",
    color: "#111111",
    fontSize: "19px",
    fontWeight: 900,
    boxSizing: "border-box",
    boxShadow: "0 14px 30px rgba(124,255,91,0.20)",
  },
  status: {
    marginTop: "14px",
    color: "rgba(255,255,255,0.84)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  error: {
    marginTop: "14px",
    color: "#f9a8a8",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  resultCard: {
    marginTop: "22px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.09)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "stretch",
  },
  resultLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.60)",
    marginBottom: "6px",
  },
  resultPrice: {
    fontSize: "34px",
    fontWeight: 900,
    lineHeight: 1,
  },
  resultDistance: {
    minWidth: "120px",
    background: "linear-gradient(180deg, #a6ff8d 0%, #7cff5b 100%)",
    borderRadius: "16px",
    padding: "14px 16px",
    color: "#111111",
    alignSelf: "stretch",
    fontSize: "22px",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resultGrid: {
    marginTop: "16px",
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "1fr 1fr",
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
  resultLink: {
    color: "#9dff73",
    textDecoration: "none",
    fontWeight: 800,
    wordBreak: "break-word",
  },
  whatsAppButton: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "none",
    background: "#25D366",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
    boxSizing: "border-box",
    marginTop: "18px",
  },
  smallText: {
    marginTop: "12px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.65,
  },
};