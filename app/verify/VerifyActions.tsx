"use client";

import { useMemo, useState } from "react";

type VerifyActionsProps = {
  customerPhone: string;
};

type ActionType = "accept" | "eta" | null;

export default function VerifyActions({ customerPhone }: VerifyActionsProps) {
  const [etaMinutes, setEtaMinutes] = useState("10");
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);

  const cleanPhone = useMemo(() => {
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
    if (!cleanPhone) return;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function openSms(message: string) {
    if (!cleanPhone) return;

    const isiOS =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const url = isiOS
      ? `sms:${cleanPhone}&body=${encodeURIComponent(message)}`
      : `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  }

  function getAcceptMessage() {
    return "Dzień dobry, potwierdzam przyjęcie kursu. Już jadę.";
  }

  function getEtaMessage() {
    return `Dzień dobry, potwierdzam kurs. Będę za około ${etaMinutes} minut.`;
  }

  function handleSend(channel: "whatsapp" | "sms") {
    const message =
      selectedAction === "accept" ? getAcceptMessage() : getEtaMessage();

    if (channel === "whatsapp") {
      openWhatsApp(message);
    } else {
      openSms(message);
    }
  }

  return (
    <div style={styles.wrapper}>
      <button
        onClick={() =>
          setSelectedAction((prev) => (prev === "accept" ? null : "accept"))
        }
        style={styles.acceptButton}
      >
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

        <button
          onClick={() =>
            setSelectedAction((prev) => (prev === "eta" ? null : "eta"))
          }
          style={styles.etaButton}
        >
          Wyślij czas do klienta
        </button>
      </div>

      {selectedAction && (
        <div style={styles.channelBox}>
          <div style={styles.channelTitle}>
            {selectedAction === "accept"
              ? "Wybierz kanał akceptacji kursu"
              : `Wyślij informację: będę za około ${etaMinutes} min`}
          </div>

          <div style={styles.channelButtons}>
            <button
              onClick={() => handleSend("whatsapp")}
              style={styles.whatsAppButton}
            >
              Wyślij przez WhatsApp
            </button>

            <button
              onClick={() => handleSend("sms")}
              style={styles.smsButton}
            >
              Wyślij przez SMS
            </button>
          </div>
        </div>
      )}
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
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#25D366",
    color: "#fff",
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
  },
  etaButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#323232",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
  },
  channelBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "#1a1a1a",
    borderRadius: "14px",
    padding: "14px",
  },
  channelTitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 600,
  },
  channelButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  whatsAppButton: {
    padding: "14px",
    borderRadius: "12px",
    background: "#25D366",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  smsButton: {
    padding: "14px",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};