export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>KievoTaxi</h1>

      <p>Wpisz trasę:</p>

      <input
        placeholder="np. Rzeszów → Lotnisko Kraków"
        style={{ padding: 10, width: 300 }}
      />

      <br /><br />

      <button style={{ padding: 10 }}>
        Oblicz cenę
      </button>
    </div>
  );
}