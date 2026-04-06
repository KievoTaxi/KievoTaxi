import { verifySignedQuote } from "../../lib/quote";

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main style={styles.wrapper}>
        <div style={styles.card}>
          <h1 style={styles.title}>Brak tokenu wyceny</h1>
        </div>
      </main>
    );
  }

  const quote = verifySignedQuote(token);

  if (!quote) {
    return (
      <main style={styles.wrapper}>
        <div style={styles.card}>
          <h1 style={styles.title}>Nieprawidłowy lub zmieniony link wyceny</h1>
        </div>
      </main>
    );
  }

  const pickupText =
    quote.rideTimeType === "now" ? "Jak najszybciej" : quote.rideTime;

  const mapsPickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    quote.from
  )}&travelmode=driving`;

  const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    quote.from
  )}&destination=${encodeURIComponent(quote.to)}&travelmode=driving`;

  return (
    <main style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Weryfikacja zamówienia</h1>

        <div style={styles.row}>
          <span style={styles.label}>Imię:</span>
          <strong>{quote.name}</strong>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Telefon:</span>
          <a href={`tel:${quote.phone}`} style={styles.link}>
            {quote.phone}
          </a>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Liczba osób:</span>
          <strong>{quote.peopleCount}</strong>
        </div>

        <div style={styles.rowBlock}>
          <span style={styles.label}>Trasa:</span>
          <div>
            <div>{quote.from}</div>
            <div style={{ opacity: 0.7, margin: "6px 0" }}>↓</div>
            <div>{quote.to}</div>
          </div>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Czas odbioru:</span>
          <strong>{pickupText}</strong>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Dystans:</span>
          <strong>{quote.distanceKm.toFixed(1)} km</strong>
        </div>

        <div style={styles.priceBox}>
          Cena z systemu: <strong>{quote.price} zł</strong>
        </div>

        <div style={styles.buttonGroup}>
          <a href={mapsPickupUrl} target="_blank" style={styles.button}>
            Nawiguj do klienta
          </a>

          <a href={mapsRouteUrl} target="_blank" style={styles.buttonSecondary}>
            Otwórz trasę
          </a>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "#161616",
    borderRadius: "18px",
    padding: "24px",
    boxSizing: "border-box",
  },
  title: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "28px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "14px",
    lineHeight: 1.5,
  },
  rowBlock: {
    marginBottom: "18px",
    lineHeight: 1.6,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    display: "block",
    marginBottom: "6px",
    minWidth: "120px",
  },
  priceBox: {
    marginTop: "18px",
    marginBottom: "20px",
    background: "rgba(124,255,91,0.12)",
    border: "1px solid rgba(124,255,91,0.35)",
    borderRadius: "14px",
    padding: "16px",
    fontSize: "20px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  button: {
    display: "block",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#7CFF5B",
    color: "#111",
    textDecoration: "none",
    fontWeight: 700,
  },
  buttonSecondary: {
    display: "block",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#2a2a2a",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  },
  link: {
    color: "#7CFF5B",
    textDecoration: "none",
  },
};