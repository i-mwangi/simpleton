# LatexV — Missing Features & Implementation Plan

> Local planning document — gitignored, not for commit.
> Baseline: feature comparison against the "Feynman" demo video (Dec 2025 audit).
> What already works: prompt → streaming LaTeX → auto-compile with self-correction
> (3 retries × 3 engines) → Supabase upload → split-pane editor → PDF download.

---

## ✅ P0 — CSV upload → data-driven report — DONE (July 5, 2026)

Implemented: services/files.py + POST /files, file_ids through GenerateRequest →
agent_stream → system prompt (pgfplots/booktabs rules), frontend dropzone + chips.
Verified end-to-end: CSV → 2-page lab report with real-data booktabs tables and a
pgfplots stress-strain plot, uploaded to Supabase. Bonus fixes: pipe-buffer deadlock
in compiler.py (engine output now goes to files), compile moved off the event loop
via run_in_threadpool.

Original spec below for reference.

## P0 — CSV upload → data-driven report (the headline gap)

The demo's whole pitch: drag in a CSV, prompt "generate a lab report", get a PDF
with tables and graphs built from the actual data. Nothing of this exists today —
`GenerateRequest` (backend/models/generate_models.py) only carries a text prompt.

### 1a. Backend: file upload endpoint
- New `POST /files` route in `backend/api/routes.py` using FastAPI `UploadFile`.
- Validate: extension whitelist (`.csv`, later `.xlsx`/`.json`), size cap (~5 MB),
  reject empty files.
- Parse with pandas (add `pandas` to `backend/pyproject.toml` via `uv add pandas`).
- Return a `file_id` + parsed summary (columns, dtypes, row count, first ~20 rows).
- Storage decision: keep parsed summary in Redis keyed by `file_id` (24h TTL,
  matches session TTL) — avoids a new DB table for v1. Raw file not needed after
  parsing.

### 1b. Backend: inject data into generation
- Extend `GenerateRequest` with optional `file_ids: list[str]`.
- In `agent_stream()` (backend/api/routes.py), when file_ids present: pull summaries
  from Redis and prepend a data block to the prompt (column names, stats, sample rows;
  cap the sample so the prompt stays small).
- Extend `_GENERATE_SYSTEM` (backend/graph/nodes.py): when data is provided, use
  `booktabs` for tables and `pgfplots` for charts, plot from inline `\addplot table`
  coordinates, never invent data values.
- MiKTeX side is ready: AutoInstall=1 is set, so pgfplots installs on first use
  (first compile with it will be slow — consider preinstalling: `miktex packages
  install pgfplots`).

### 1c. Frontend: dropzone
- Add drag-and-drop + file picker to the prompt area in
  `frontend/src/app/app/editor/page.tsx` (and/or the landing prompt box).
- Upload on drop → show file chip with remove button (like Feynman's `ABS(ABS-3).csv ⊗`).
- Pass returned `file_ids` in the generate request body.
- API client changes in `frontend/src/lib/api.ts` (multipart POST).

**Effort:** ~1 day. **Depends on:** nothing.

---

## P1 — Selection-based inline AI editing

Demo: highlight a block of LaTeX → floating prompt box → "remove this section" →
targeted rewrite. Today the edit box operates on the whole document only.

- Backend: new `POST /v2/agent/edit` accepting `{latex, selection_start, selection_end,
  instruction}`; system prompt = "rewrite ONLY the selected span, return the full
  document"; reuse the existing compile-on-success flow.
- Frontend: capture `selectionStart/End` from the code textarea; on selection, show a
  floating input anchored near the selection; splice the response back in and trigger
  recompile.
- **Also fixes the fake live-edit:** `frontend/src/app/app/editor/page.tsx:244` has a
  comment admitting the char-by-char edit animation is simulated ("In a real
  implementation, this would call a live editing API"). Replace the simulation with a
  real streaming edit endpoint (same SSE pattern as `/v2/agent/stream`).

**Effort:** ~1 day (backend half-day, frontend half-day).

---

## P2 — Export as TeX

Demo has "Export as PDF / Export as TeX" dropdown. LatexV has only Download PDF.

- Pure frontend: `new Blob([latexCode], {type: "application/x-tex"})` + anchor
  download as `document.tex`. Add a small export dropdown next to the existing
  Download PDF button in `editor/page.tsx` (~line 822).

**Effort:** <1 hour.

---

## ✅ P3 — Agent activity panel — DONE (July 5, 2026)

Implemented as a floating, draggable panel (components/AgentPanel.tsx): auto-opens
on generate, streams user/agent/tool messages from the SSE events (deduped),
collapses to a floating LV logo button, has a follow-up input wired to the
generation flow. Bonus: line-number gutter added to LatexEditor.tsx.
Verified in live preview: pop-out, streaming, collapse, reopen, drag + clamping.

Original spec below for reference.

## P3 — Agent activity sidebar

Demo shows a chat-style panel streaming the agent's steps ("17 of 20 messages
remaining", tool calls, thinking). LatexV shows a one-line status banner.

- The data already exists: the SSE stream emits `status` + `message` per event
  (`planning / generating / compiling / fixing / done / failed`).
- Frontend: collapsible right-hand panel that appends each SSE status transition as
  a timeline entry instead of overwriting a single line. No backend change needed
  for v1.
- v2 (optional): emit richer events from `agent_stream()` — e.g. which engine
  compiled, retry reasons, fix diffs.

**Effort:** half day (v1).

---

## Tech-debt / correctness items found during the audit (not in the demo)

| Item | Where | Notes |
|---|---|---|
| `/conversations` polled ~1×/sec | frontend (find the `setInterval`) | Burns Supabase quota; poll on focus/after-generation instead, or 30s interval |
| Contact form doesn't send email | `backend/api/routes.py` `/contact` | Just prints to console; wire to an email service or drop the "we'll reply in 24h" copy |
| Deprecated `google.generativeai` | `backend/services/llm_service.py` | Package is EOL; migrate to `google-genai` |
| `document_versions` never written | version read endpoints exist in routes.py; nothing calls `versions.create_version` in the generate flow | Either write a version per successful compile or drop the endpoints |
| pdflatex first-run timeout (120 s) | `backend/tools/compiler.py` `MAX_COMPILATION_TIME` | MiKTeX builds fonts/packages on first use; engine fallback already covers it, but consider 180 s or a warm-up compile at startup |
| Rate limiting is per-IP only | `cache_redis/rate_limiter.py` usage in routes | README's own deployment notes say to make it per-user |
| README schema section outdated | root `README.md` | Says `hashed_password`, no `role` column; actual schema is `backend/db/schema.sql` (authoritative, matches code) |

---

## Suggested order

1. **P0 CSV pipeline** — the differentiator; everything else is polish.
2. **P2 TeX export** — trivial win, do it while P0 compiles.
3. **P1 inline editing** — replaces the simulated live-edit with a real one.
4. **P3 agent sidebar** — pure UI, do last.
5. Tech-debt items opportunistically, starting with the /conversations polling.
