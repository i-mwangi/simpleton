"use client";
import { useEffect, useState } from "react";

/** Auto-cycling prompt -> document type -> compiled page strip. */
const EXAMPLES = [
  {
    id: "plots",
    label: "Plots & charts",
    sub: "pgfplots figures",
    accent: "#3f8f5f",
    tint: "rgba(63, 143, 95, 0.16)",
    prompt:
      "A visual plots showcase: a 3D ribbon of sin(x), a vector field inside a cube, and a box plot comparing outcomes across three test cycles.",
    img: "/viz-showcase.png",
  },
  {
    id: "diagrams",
    label: "Diagrams & circuits",
    sub: "TikZ + quantikz",
    accent: "#c9822d",
    tint: "rgba(201, 130, 45, 0.16)",
    prompt:
      "A diagrams sheet: a pie chart of the five V's of Big Data, a 4-qubit quantum circuit with measurements, and a transformer block diagram with a residual connection.",
    img: "/showcase-diagrams.png",
  },
  {
    id: "textbook",
    label: "Textbook chapter",
    sub: "objectives + figures",
    accent: "#c0503f",
    tint: "rgba(192, 80, 63, 0.16)",
    prompt:
      "A textbook lesson on the nature of light: numbered sections with objectives boxes, a worked example, and wave figures showing 700 nm and 400 nm light.",
    img: "/showcase-textbook.png",
  },
];

function Arrow({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill={color} style={{ transition: "fill 0.4s ease", flexShrink: 0 }}>
        <path d="M4 9h8V5l8 7-8 7v-4H4z" />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % EXAMPLES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const ex = EXAMPLES[active];

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      {/* Column captions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 38px 1fr 38px 1fr", gap: "10px", marginBottom: "16px" }}>
        {[
          <span key="a"><strong>Describe it</strong> in plain English — no LaTeX required.</span>,
          <span key="s1" />,
          <span key="b"><strong>The agent writes</strong> the LaTeX, compiles it, and fixes its own errors.</span>,
          <span key="s2" />,
          <span key="c"><strong>Download</strong> a finished, vector-sharp PDF.</span>,
        ].map((c, i) => (
          <p key={i} style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{c}</p>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 38px 1fr 38px 1fr", gap: "10px", alignItems: "center" }}>
        {/* Prompt card */}
        <div className="soft-card" style={{ padding: 0, overflow: "hidden", alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ex.accent, transition: "background 0.4s ease" }} />
            <span className="mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>prompt</span>
          </div>
          <p key={ex.id} className="mono" style={{ padding: "14px", fontSize: "12px", lineHeight: 1.7, color: "var(--text-primary)", animation: "fadeUp 0.45s ease", margin: 0, flex: 1 }}>
            &quot;{ex.prompt}&quot;
          </p>
        </div>

        <Arrow color={ex.accent} />

        {/* Document type cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {EXAMPLES.map((e, i) => {
            const on = i === active;
            return (
              <button
                key={e.id}
                onClick={() => setActive(i)}
                style={{
                  textAlign: "left",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: on ? `1px solid ${e.accent}` : "1px solid var(--border)",
                  background: on
                    ? `linear-gradient(100deg, ${e.tint}, var(--bg-surface))`
                    : "var(--bg-surface)",
                  cursor: "pointer",
                  transition: "background 0.4s ease, border-color 0.4s ease",
                }}
              >
                <span className="mono" style={{ display: "block", fontSize: "10.5px", color: on ? e.accent : "var(--text-muted)", marginBottom: "3px", transition: "color 0.4s ease" }}>
                  {e.sub}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{e.label}</span>
              </button>
            );
          })}
        </div>

        <Arrow color={ex.accent} />

        {/* Compiled page */}
        <div
          style={{
            alignSelf: "stretch",
            borderRadius: "12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            minHeight: "330px",
          }}
        >
          <img
            key={ex.img}
            src={ex.img}
            alt={`Compiled PDF page: ${ex.label}`}
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              width: "auto",
              height: "auto",
              display: "block",
              background: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              borderRadius: "3px",
              animation: "fadeUp 0.45s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
