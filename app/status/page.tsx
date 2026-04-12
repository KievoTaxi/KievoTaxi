"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Order = {
  id: string;
  name: string;
  phone: string;
  from_address: string;
  to_address: string;
  people_count: number;
  pickup_time: string;
  status: string;
  eta: number | null;
  price: number | null;
  distance_km: number | null;
  created_at: string;
  quote_code: string | null;
};

export default function StatusPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    fetchOrder(code);

    const channel = supabase
      .channel(`order-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const next = payload.new as Order | undefined;

          if (next && next.quote_code === code) {
            setOrder(next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  async function fetchOrder(currentCode: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("quote_code", currentCode)
      .single();

    if (error) {
      console.error("Fetch order error:", error);
      setOrder(null);
      setLoading(false);
      return;
    }

    setOrder(data as Order);
    setLoading(false);
  }

  function statusText() {
    if (!order) return "";

    if (order.status === "pending") return "Szukamy kierowcy...";
    if (order.status === "accepted") return "Kierowca przyjął kurs";
    if (order.status === "on_route") {
      return order.eta
        ? `Kierowca jedzie • ${order.eta} min`
        : "Kierowca w drodze";
    }
    if (order.status === "completed") return "Kurs zakończony";
    if (order.status === "cancelled") return "Kurs anulowany";

    return "Status nieznany";
  }

  if (!code) {
    return <div style={styles.center}>Brak kodu zamówienia</div>;
  }

  if (loading) {
    return <div style={styles.center}>Ładowanie...</div>;
  }

  if (!order) {
    return <div style={styles.center}>Nie znaleziono zamówienia</div>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Status przejazdu</h1>

        <div style={styles.status}>{statusText()}</div>

        <div style={styles.box}>
          <div>{order.from_address}</div>
          <div style={{ margin: "8px 0" }}>↓</div>
          <div>{order.to_address}</div>
        </div>

        <div style={styles.grid}>
          <div>
            <span style={styles.label}>Cena</span>
            <strong>{order.price ? `${order.price} zł` : "-"}</strong>
          </div>

          <div>
            <span style={styles.label}>Dystans</span>
            <strong>{order.distance_km ? `${order.distance_km} km` : "-"}</strong>
          </div>

          <div>
            <span style={styles.label}>Osoby</span>
            <strong>{order.people_count}</strong>
          </div>

          <div>
            <span style={styles.label}>Odbiór</span>
            <strong>{order.pickup_time}</strong>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    background: "#161616",
    borderRadius: "16px",
    boxSizing: "border-box",
  },
  title: {
    marginBottom: "16px",
  },
  status: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  box: {
    padding: "16px",
    background: "#1f1f1f",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    opacity: 0.6,
    marginBottom: "4px",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    background: "#0b0b0b",
  },
};