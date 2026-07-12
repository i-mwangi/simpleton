"use client";
import { useEffect, useRef } from "react";
import DotIcon from "@/components/DotIcon";

const BEATS = [
  {
    id: "hook",
    shape: "sparkle" as const,
    headline: "What if LaTeX wrote itself?",
    body: "No more wrestling with syntax, missing packages, or cryptic errors. Just describe the document you want.",
  },
  {
    id: "describe",
    shape: "pencil" as const,
    headline: "Describe it in plain English",
    body: "Tell the agent what you need — a resume, a lab report, a research paper — or drop in a dataset to work from.",
  },
  {
    id: "generate",
    shape: "bolt" as const,
    headline: "Watch it write itself",
    body: "The LaTeX streams in character by character as the agent plans the structure and lays out every section.",
  },
  {
    id: "data",
    shape: "chart" as const,
    headline: "Data becomes documents",
    body: "Upload a CSV and it builds clean tables and charts straight from your real numbers — never invented.",
  },
  {
    id: "fix",
    shape: "wrench" as const,
    headline: "It fixes its own mistakes",
    body: "Compilation errors are read, corrected, and recompiled automatically — up to three times — until the PDF builds.",
  },
  {
    id: "refine",
    shape: "chat" as const,
    headline: "Refine by conversation",
    body: "Ask for changes in plain language, or edit the code directly. Recompile and see the result beside you instantly.",
  },
  {
    id: "export",
    shape: "download" as const,
    headline: "Export and share",
    body: "Download the polished PDF or the raw .tex. Your document is ready to print, submit, or hand off.",
  },
];

export default function StorySection() {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const beats = el.querySelectorAll<HTMLElement>(".ld-story-beat");
    if (!beats.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ld-story-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    beats.forEach((b) => obs.observe(b));
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ padding: "40px 24px 96px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p style={{ fontSize: "13px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-deep)", marginBottom: "12px" }}>
            The story
          </p>
          <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 700, color: "var(--text-primary)" }}>
            From a sentence to a finished PDF
          </h2>
        </div>

        <div className="ld-story-timeline" ref={timelineRef}>
          {BEATS.map((beat, i) => (
            <div
              key={beat.id}
              className="ld-story-beat"
              style={{ ["--beat-delay" as string]: `${(i % 2) * 0.08}s` }}
            >
              <div className="ld-story-icon"><DotIcon shape={beat.shape} size={22} bare /></div>
              <h3 className="ld-story-beat-headline">{beat.headline}</h3>
              <p className="ld-story-beat-body">{beat.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
