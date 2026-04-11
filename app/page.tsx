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
      <div style={styles.overlay}>
        <section style={styles.shell}>
          <div style={styles.heroCard}>
            <div style={styles.badge}>Prywatny przejazd • szybka wycena</div>

            <h1 style={styles.title}>KievoTaxi</h1>

            <p style={styles.subtitle}>
              Prosta wycena bez dzwonienia i bez zgadywania ceny. Podaj trasę,
              wybierz czas odbioru i od razu zobacz koszt przejazdu.
            </p>

            <div style={styles.whyBox}>
              <div style={styles.whyItem}>
                <span style={styles.whyDot} />
                <span>Jasna wycena przed zamówieniem</span>
              </div>
              <div style={styles.whyItem}>
                <span style={styles.whyDot} />
                <span>Kontakt przez WhatsApp po jednym kliknięciu</span>
              </div>
              <div style={styles.whyItem}>
                <span style={styles.whyDot} />
                <span>Trasa i cena weryfikowane systemowo</span>
              </div>
            </div>
          </div>

          <section style={styles.formCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Oblicz cenę przejazdu</h2>
              <p style={styles.sectionText}>
                Wpisz dokładny adres startowy i docelowy, żeby wycena była
                możliwie precyzyjna.
              </p>
            </div>

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
                <option value="1" style={styles.selectOption}>
                  1 osoba
                </option>
                <option value="2" style={styles.selectOption}>
                  2 osoby
                </option>
                <option value="3" style={styles.selectOption}>
                  3 osoby
                </option>
                <option value="4" style={styles.selectOption}>
                  4 osoby
                </option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Czas odbioru</label>

              <div style={styles.timeButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setRideTimeType("now");
                    setRideTime("");
                    setError("");
                  }}
                  style={{
                    ...styles.timeButton,
                    border:
                      rideTimeType === "now"
                        ? "2px solid #7cff5b"
                        : "1px solid rgba(255,255,255,0.14)",
                    background:
                      rideTimeType === "now"
                        ? "linear-gradient(180deg, rgba(124,255,91,0.22), rgba(124,255,91,0.10))"
                        : "rgba(255,255,255,0.05)",
                    boxShadow:
                      rideTimeType === "now"
                        ? "0 0 0 1px rgba(124,255,91,0.12) inset"
                        : "none",
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
                    ...styles.timeButton,
                    border:
                      rideTimeType === "later"
                        ? "2px solid #7cff5b"
                        : "1px solid rgba(255,255,255,0.14)",
                    background:
                      rideTimeType === "later"
                        ? "linear-gradient(180deg, rgba(124,255,91,0.22), rgba(124,255,91,0.10))"
                        : "rgba(255,255,255,0.05)",
                    boxShadow:
                      rideTimeType === "later"
                        ? "0 0 0 1px rgba(124,255,91,0.12) inset"
                        : "none",
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
                placeholder="np. Adam"
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
                <div style={styles.resultTop}>
                  <div>
                    <div style={styles.resultSmall}>Dystans</div>
                    <div style={styles.resultValue}>{distance}</div>
                  </div>

                  <div style={styles.priceTag}>
                    <div style={styles.resultSmallDark}>Cena</div>
                    <div style={styles.priceValue}>{price}</div>
                  </div>
                </div>

                <div style={styles.resultDetails}>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Odbiór</span>
                    <strong>
                      {rideTimeType === "now" ? "Jak najszybciej" : rideTime}
                    </strong>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Liczba osób</span>
                    <strong>{peopleCount}</strong>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Kod wyceny</span>
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
          </section>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#050505",
    backgroundImage:
      "linear-gradient(rgba(6,6,6,0.70), rgba(6,6,6,0.88)), url('/toyota.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  },
  overlay: {
    minHeight: "100vh",
    padding: "28px 16px",
    boxSizing: "border-box",
  },
  shell: {
    width: "100%",
    maxWidth: "1080px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.95fr",
    gap: "24px",
    alignItems: "start",
  },
  heroCard: {
    background: "linear-gradient(180deg, rgba(0,0,0,0.56), rgba(0,0,0,0.36))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "34px",
    color: "#ffffff",
    boxShadow: "0 20px 80px rgba(0,0,0,0.30)",
    backdropFilter: "blur(8px)",
    minHeight: "220px",
  },
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(124,255,91,0.10)",
    border: "1px solid rgba(124,255,91,0.20)",
    color: "#b7ffaa",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "52px",
    lineHeight: 1,
    letterSpacing: "-0.03em",
    marginBottom: "14px",
  },
  subtitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.86)",
    maxWidth: "620px",
  },
  whyBox: {
    marginTop: "26px",
    display: "grid",
    gap: "12px",
  },
  whyItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255,255,255,0.88)",
    fontSize: "15px",
  },
  whyDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#7cff5b",
    boxShadow: "0 0 16px rgba(124,255,91,0.55)",
    flexShrink: 0,
  },
  formCard: {
    width: "100%",
    background: "rgba(0,0,0,0.74)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "28px",
    color: "#ffffff",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    boxSizing: "border-box",
  },
  sectionHeader: {
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "28px",
    marginBottom: "8px",
  },
  sectionText: {
    margin: 0,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  fieldGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontSize: "15px",
    marginBottom: "10px",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: "17px",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  selectOption: {
    color: "#111111",
  },
  secondaryButton: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "17px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(180deg, #8fff6f 0%, #7cff5b 100%)",
    color: "#111111",
    fontSize: "19px",
    fontWeight: 800,
    boxSizing: "border-box",
    boxShadow: "0 14px 30px rgba(124,255,91,0.22)",
  },
  timeButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  timeButton: {
    minHeight: "108px",
    padding: "14px",
    borderRadius: "18px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    lineHeight: 1.35,
  },
  status: {
    marginTop: "14px",
    color: "rgba(255,255,255,0.82)",
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
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  resultTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "stretch",
  },
  resultSmall: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.60)",
    marginBottom: "6px",
  },
  resultSmallDark: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(0,0,0,0.55)",
    marginBottom: "6px",
  },
  resultValue: {
    fontSize: "24px",
    fontWeight: 800,
  },
  priceTag: {
    minWidth: "132px",
    background: "linear-gradient(180deg, #a6ff8d 0%, #7cff5b 100%)",
    borderRadius: "16px",
    padding: "12px 14px",
    color: "#111111",
    alignSelf: "stretch",
  },
  priceValue: {
    fontSize: "26px",
    fontWeight: 900,
  },
  resultDetails: {
    marginTop: "16px",
    display: "grid",
    gap: "10px",
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    lineHeight: 1.5,
    fontSize: "15px",
  },
  resultLabel: {
    color: "rgba(255,255,255,0.68)",
  },
  whatsAppButton: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "none",
    background: "#25D366",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 800,
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