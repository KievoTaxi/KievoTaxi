"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  from_address: string | null;
  to_address: string | null;
  people_count: number | null;
  pickup_time: string | null;
  status: string | null;
  eta: number | null;
};

const ETA_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

export default function DriverPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }

    setLoading(false);
  }

  async function updateOrder(
    id: string,
    updates: Partial<Pick<Order, "status" | "eta">>
  ) {
    try {
      setBusyId(id);

      const { error } = await supabase.from("orders").update(updates).eq("id", id);

      if (error) {
        console.error("Update error:", error);
        alert("Nie udało się zaktualizować zamówienia.");
      }
    } finally {
      setBusyId(null);
    }
  }

  function getStatusLabel(status: string | null) {
    switch (status) {
      case "accepted":
        return "zaakceptowane";
      case "on_route":
        return "w drodze";
      case "completed":
        return "zakończone";
      case "cancelled":
        return "anulowane";
      default:
        return "oczekuje";
    }
  }

  function getStatusStyle(status: string | null): React.CSSProperties {
    switch (status) {
      case "accepted":
        return styles.statusAccepted;
      case "on_route":
        return styles.statusOnRoute;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.kicker}>KIEVO • PANEL KIEROWCY</div>
            <h1 style={styles.title}>Zamówienia na żywo</h1>
          </div>
        </div>

        {loading && <div style={styles.infoBox}>Ładowanie zamówień...</div>}

        {!loading && orders.length === 0 && (
          <div style={styles.infoBox}>Brak aktywnych zamówień.</div>
        )}

        <div style={styles.list}>
          {orders.map((order) => {
            const isBusy = busyId === order.id;

            return (
              <section key={order.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.customerName}>{order.name || "Klient"}</div>
                    <div style={styles.customerPhone}>{order.phone || "Brak numeru"}</div>
                  </div>

                  <div
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(order.status),
                    }}
                  >
                    {getStatusLabel(order.status)}
                    {order.eta ? ` • ${order.eta} min` : ""}
                  </div>
                </div>

                <div style={styles.routeCard}>
                  <div style={styles.routeLine}>
                    <span style={styles.routeLabel}>Start</span>
                    <span>{order.from_address || "-"}</span>
                  </div>

                  <div style={styles.routeDivider}>↓</div>

                  <div style={styles.routeLine}>
                    <span style={styles.routeLabel}>Cel</span>
                    <span>{order.to_address || "-"}</span>
                  </div>
                </div>

                <div style={styles.metaGrid}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Liczba osób</span>
                    <strong>{order.people_count ?? "-"}</strong>
                  </div>

                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Czas odbioru</span>
                    <strong>{order.pickup_time || "-"}</strong>
                  </div>
                </div>

                <div style={styles.actionGrid}>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      updateOrder(order.id, { status: "accepted", eta: 5 })
                    }
                    style={{
                      ...styles.primaryButton,
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    Akceptuj
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => updateOrder(order.id, { status: "on_route" })}
                    style={{
                      ...styles.secondaryButton,
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    Jadę
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => updateOrder(order.id, { status: "completed" })}
                    style={{
                      ...styles.secondaryButton,
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    Zakończ
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => updateOrder(order.id, { status: "cancelled" })}
                    style={{
                      ...styles.cancelButton,
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    Odrzuć
                  </button>
                </div>

                <div style={styles.etaSection}>
                  <div style={styles.etaTitle}>Ustaw czas dojazdu do klienta</div>

                  <div style={styles.etaGrid}>
                    {ETA_OPTIONS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateOrder(order.id, {
                            status: "accepted",
                            eta: minutes,
                          })
                        }
                        style={{
                          ...styles.etaButton,
                          opacity: isBusy ? 0.7 : 1,
                        }}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#ffffff",
    padding: "24px 16px 40px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "980px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px",
  },
  kicker: {
    fontSize: "12px",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 800,
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  infoBox: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "16px",
    color: "rgba(255,255,255,0.86)",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: "22px",
    fontWeight: 900,
    lineHeight: 1.1,
  },
  customerPhone: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
  },
  statusBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statusPending: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#ffffff",
  },
  statusAccepted: {
    background: "rgba(146,255,104,0.14)",
    border: "1px solid rgba(146,255,104,0.28)",
    color: "#d4ffc4",
  },
  statusOnRoute: {
    background: "rgba(90,180,255,0.14)",
    border: "1px solid rgba(90,180,255,0.28)",
    color: "#cfe8ff",
  },
  statusCompleted: {
    background: "rgba(80,220,170,0.14)",
    border: "1px solid rgba(80,220,170,0.28)",
    color: "#cbffef",
  },
  statusCancelled: {
    background: "rgba(255,120,120,0.10)",
    border: "1px solid rgba(255,120,120,0.22)",
    color: "#ffb9b9",
  },
  routeCard: {
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  routeLine: {
    display: "grid",
    gap: "6px",
    lineHeight: 1.5,
  },
  routeLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.58)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 800,
  },
  routeDivider: {
    margin: "10px 0",
    color: "rgba(255,255,255,0.45)",
    fontWeight: 900,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "14px",
  },
  metaItem: {
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.04)",
    lineHeight: 1.45,
  },
  metaLabel: {
    display: "block",
    marginBottom: "5px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.58)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 800,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginTop: "16px",
  },
  primaryButton: {
    padding: "14px 12px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(180deg, #9dff73 0%, #7cff5b 100%)",
    color: "#111111",
    fontWeight: 900,
    fontSize: "14px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "14px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "14px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,120,120,0.18)",
    background: "rgba(255,120,120,0.08)",
    color: "#ffb6b6",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  },
  etaSection: {
    marginTop: "16px",
  },
  etaTitle: {
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.84)",
  },
  etaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px",
  },
  etaButton: {
    padding: "10px 8px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
  },
};