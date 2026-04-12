"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Order = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  from_address: string;
  to_address: string;
  people_count: number;
  pickup_time: string;
  status: string;
  eta: number | null;
  quote_code: string | null;
  price: number | null;
  distance_km: number | null;
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

    if (error) {
      console.error("Fetch orders error:", error);
      setLoading(false);
      return;
    }

    setOrders((data as Order[]) || []);
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
        console.error("Update order error:", error);
        alert("Nie udało się zaktualizować kursu.");
      }
    } finally {
      setBusyId(null);
    }
  }

  function formatTime(value: string) {
    try {
      return new Date(value).toLocaleString("pl-PL");
    } catch {
      return value;
    }
  }

  function statusLabel(status: string) {
    if (status === "accepted") return "Zaakceptowane";
    if (status === "on_route") return "W drodze";
    if (status === "completed") return "Zakończone";
    if (status === "cancelled") return "Anulowane";
    return "Nowe";
  }

  function statusStyle(status: string) {
    if (status === "accepted") return styles.statusAccepted;
    if (status === "on_route") return styles.statusOnRoute;
    if (status === "completed") return styles.statusCompleted;
    if (status === "cancelled") return styles.statusCancelled;
    return styles.statusPending;
  }

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />
      <section style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.badge}>KievoTaxi • panel kierowcy</div>
          <h1 style={styles.title}>Zamówienia na żywo</h1>
          <p style={styles.subtitle}>
            Odbieraj kursy, ustawiaj ETA i aktualizuj status klienta.
          </p>
        </div>

        {loading ? (
          <div style={styles.infoCard}>Ładowanie kursów...</div>
        ) : orders.length === 0 ? (
          <div style={styles.infoCard}>Brak zamówień.</div>
        ) : (
          <div style={styles.ordersList}>
            {orders.map((order) => {
              const isBusy = busyId === order.id;

              return (
                <article key={order.id} style={styles.orderCard}>
                  <div style={styles.orderTop}>
                    <div>
                      <div style={styles.orderName}>{order.name}</div>
                      <a href={`tel:${order.phone}`} style={styles.phoneLink}>
                        {order.phone}
                      </a>
                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,
                        ...statusStyle(order.status),
                      }}
                    >
                      {statusLabel(order.status)}
                      {order.eta ? ` • ${order.eta} min` : ""}
                    </div>
                  </div>

                  <div style={styles.routeBox}>
                    <div style={styles.routeLabel}>Trasa</div>
                    <div style={styles.routeText}>
                      {order.from_address}
                      <br />
                      ↓
                      <br />
                      {order.to_address}
                    </div>
                  </div>

                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Cena</span>
                      <strong>{order.price ? `${order.price} zł` : "-"}</strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Dystans</span>
                      <strong>
                        {order.distance_km ? `${order.distance_km} km` : "-"}
                      </strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Kod</span>
                      <strong>{order.quote_code || "-"}</strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Osoby</span>
                      <strong>{order.people_count}</strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Odbiór</span>
                      <strong>{order.pickup_time}</strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Dodano</span>
                      <strong>{formatTime(order.created_at)}</strong>
                    </div>
                  </div>

                  <div style={styles.actionGrid}>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        updateOrder(order.id, {
                          status: "accepted",
                          eta: order.eta ?? 5,
                        })
                      }
                      style={{
                        ...styles.primaryButton,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Akceptuj
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        updateOrder(order.id, {
                          status: "on_route",
                        })
                      }
                      style={{
                        ...styles.secondaryButton,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Jadę
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        updateOrder(order.id, {
                          status: "completed",
                        })
                      }
                      style={{
                        ...styles.secondaryButton,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Zakończ
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        updateOrder(order.id, {
                          status: "cancelled",
                        })
                      }
                      style={{
                        ...styles.cancelButton,
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Odrzuć
                    </button>
                  </div>

                  <div style={styles.etaSection}>
                    <div style={styles.etaTitle}>Ustaw ETA</div>
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
                            ...(order.eta === minutes ? styles.etaButtonActive : {}),
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(124,255,91,0.08), transparent 35%), #060606",
    position: "relative",
    color: "#fff",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "28px 16px 40px",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "24px",
  },
  badge: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(124,255,91,0.10)",
    border: "1px solid rgba(124,255,91,0.22)",
    color: "#d9ffcc",
    fontWeight: 800,
    fontSize: "13px",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  infoCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
  },
  ordersList: {
    display: "grid",
    gap: "18px",
  },
  orderCard: {
    background: "rgba(15,15,15,0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "20px",
    boxSizing: "border-box",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  orderName: {
    fontSize: "24px",
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: "6px",
  },
  phoneLink: {
    color: "#9dff73",
    textDecoration: "none",
    fontWeight: 700,
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
    background: "rgba(124,255,91,0.14)",
    border: "1px solid rgba(124,255,91,0.28)",
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
  routeBox: {
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    marginBottom: "14px",
  },
  routeLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "8px",
    fontWeight: 800,
  },
  routeText: {
    fontSize: "16px",
    lineHeight: 1.6,
    fontWeight: 700,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  metaItem: {
    padding: "14px",
    borderRadius: "16px",
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
    marginBottom: "16px",
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
    marginTop: "4px",
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
  etaButtonActive: {
    border: "1px solid rgba(124,255,91,0.40)",
    background: "rgba(124,255,91,0.14)",
    color: "#d8ffcb",
  },
};