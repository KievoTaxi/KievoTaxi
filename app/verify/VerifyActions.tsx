"use client";

import { useMemo, useState } from "react";

type VerifyActionsProps = {
  customerPhone: string;
};

export default function VerifyActions({ customerPhone }: VerifyActionsProps) {
  const [etaMinutes, setEtaMinutes] = useState("10");

  const whatsappPhone = useMemo(() => {
    const digits = customerPhone.replace(/\D/g, "");

    if (digits.startsWith("48") && digits.length >= 11) {
      return digits;
    }

    if (digits.length === 9) {
      return `48${digits}`;
    }

    return digits;
  }, [customerPhone]);

  function openWhatsApp(message: string) {
    if (!whatsappPhone) return;

    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  }

  function handleAcceptCourse() {
    openWhatsApp("Dzień dobry, potwierdzam przyjęcie kursu. Już jadę.");
  }

  function handleSendEta() {
    openWhatsApp(
      `Dzień dobry, potwierdzam kurs. Będę za około ${etaMinutes} minut.`
    );
  }

  return (
    <div style={styles.wrapper}>
      <button onClick={handleAcceptCourse} style={styles.acceptButton}>
        Akceptuj kurs
      </button>

      <div style={styles.etaBox}>
        <label style={styles.label}>Będę za:</label>

        <select
          value={etaMinutes}
          onChange={(e) => setEtaMinutes(e.target.value)}
          style={styles.select}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const minutes = (i + 1) * 5;
            return (
              <option key={minutes} value={String(minutes)}>
                {minutes} min
              </option>
            );
          })}
        </select>

        <button onClick={handleSendEta} style={styles.etaButton}>
          Wyślij czas do klienta
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "16px",
  },
  acceptButton: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#25D366",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
  },
  etaBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "#202020",
    borderRadius: "14px",
    padding: "14px",
  },
  label: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "14px",
    fontWeight: 600,
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#2a2a2a",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },
  etaButton: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#323232",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
  },
};