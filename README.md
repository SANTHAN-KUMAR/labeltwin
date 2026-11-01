# LabelTwin: Compile. Verify. Prove.

**Teliport Season 4 (Tata Elxsi) · Case Study 4: End-to-End Medical Device Labeling Automation**
**Team Astute Computer:** Jai Surya R (team leader) · Karnala Santhan Kumar

LabelTwin treats medical device labeling as a build pipeline:

1. One source of truth (product master + machine-readable regulatory requirement graph + versioned symbol and phrase libraries) **compiles** every label deterministically.
2. A suite of deterministic checks **verifies** it.
3. A signed **Label Bill of Materials (LBOM)** and a hash-chained audit ledger **prove** why every element exists.

GenAI speeds up everything around the compiler: reading changes, drafting from approved phrases, reading legacy artwork, and proposing fixes. It never has the final word on a label.

This repository is the **interactive prototype**. It is a static web app (Vite + React + TypeScript), needs no backend and no API keys, and runs on free Vercel or Netlify hosting.

---

## 1. Features mapped to the evaluation criteria

| Evaluation criterion | Where it is demonstrated | What runs for real in the browser |
|---|---|---|
| Understanding of the labeling problem | Overview, **Impact & evidence** | Problem framed from 218 real FDA labeling-recall events (openFDA, 2023 to Oct 2026), classified by preventing control; optional live openFDA refresh |
| Regulatory / compliance awareness | **RegWatch**, Requirement Graph table, element provenance | Requirement Graph of MDR Annex I §23, Art. 10/13/20/27, 21 CFR 801, ISO 15223-1 + Amd 1:2025, ISO 20417:2026, and rules for UK, CH, JP, CN, AU and SA; optional live poll of the eCFR versioner |
| Innovation in label design using AI | **Compile & trace**, **Change Copilot** | The label compiler picks required elements per market and packaging level, measures text, auto-lays out a 23-language panel and generates a GS1 DataMatrix; the Change Copilot turns plain text or voice into a structured change set (same JSON schema as the production LLM) |
| AI / automation platform | Architecture, RegWatch, Impact engine, Redline, Approve | Graph-based impact traversal, artwork registration + pixel diff + semantic region classification, explainable risk score that sets reviewer routing |
| End-to-end process coverage | Steps 1–10 in the sidebar; the Architecture page maps all 19 steps of the case | Connect → RegWatch → Change → Impact → Compile → Verify → Redline → Approve → Release & line → Audit |
| Accuracy & validation approach | **Verify**, **Validation lab** | About 20k checks on 1,152 labels in under 0.2 s; barcode decode-back with zxing-cpp WASM; a defect-injected golden set (14 defect classes) reporting recall and precision |
| Traceability & auditability | **Audit & LBOM**, tap any label element | SHA-256 hash-chained ledger, ECDSA P-256 e-signatures (WebCrypto), tamper demo, LBOM and W3C PROV JSON export |

### What is real and what is simulated

**Real logic:**
- GS1 UDI engine: check digits, AI syntax, YYMMDD dates and AI order, plus BWIPP's GS1 linter when encoding.
- DataMatrix / GS1-128 generation (bwip-js) and decode-back from the rendered artwork (zxing-wasm).
- The label compiler, the Verification Suite, the cross-level consistency checks and the layout solver.
- Artwork diff with registration (pixelmatch + translation search).
- Risk scoring, the hash-chained ledger and e-signatures, and the golden-set validation.
- The optional live calls to eCFR and openFDA, which fall back to cached data if offline.

**Simulated:**
- Enterprise connectors. PLM, ERP, RIM, QMS and registry data is realistic sample data.
- LLM calls. The Change Copilot uses a deterministic extractor that emits the production JSON schema.
- Back-translation similarity scores, which are precomputed.
- Line-side cameras, emulated by decoding rendered labels. The real phone camera also works on HTTPS.

All companies, products, addresses and identifiers are **fictional**. GTINs use **GS1 prefix 952**, which GS1 reserves for demonstrations and examples. Symbol glyphs are simplified illustrations; production uses the licensed ISO 7000 / ISO 15223-1 artwork.

---

## 2. Run locally

Requires Node.js 20+ (tested with Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

---

## 3. Deploy

### Vercel (recommended)
1. Push this folder to a GitHub repository (or use the Vercel CLI).
2. In vercel.com, go to **Add New → Project → Import** the repository.
3. Vercel detects Vite automatically. `vercel.json` sets **Build command** `npm run build` and **Output directory** `dist`.
4. Click **Deploy**. You get a URL like `https://labeltwin.vercel.app`.

CLI alternative:

```bash
npm i -g vercel
vercel          # first run links the project
vercel --prod
```

### Netlify (alternative)
- **Drag and drop:** run `npm run build`, then drop the `dist/` folder on https://app.netlify.com/drop.
- **Git:** go to **Add new site → Import from Git**. `netlify.toml` already sets build `npm run build` and publish `dist`.

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

The app uses relative asset paths (`base: './'`), so it also works from any sub-path, including GitHub Pages.

After deploying, put the URL into the slide's QR placeholder. `ppt/insert_qr.py` in the submission package does this automatically.

---

## 4. Guided demo script (about 2½ minutes)

Press **"Start the 2½-minute demo"** (or **▶ Demo** on a phone). Each step has one button that does the work. Suggested talk track:

| # | Screen | Click | Say |
|---|---|---|---|
| 0 | Overview | Next | "One real product change on a Class III drug-eluting stent, across 8 markets. Watch the whole flow." |
| 1 | Connect | Resolve conflict | "PLM says 36-month shelf life; ERP and the released labels still say 24. Governance makes PLM the golden source. The conflict surfaces before it reaches artwork." |
| 2 | RegWatch | Accept as RA | "Real event: EU Implementing Decision 2026/1231 harmonised ISO 15223-1 Amd 1. It's a graph delta, RA accepts it, and adoption is scheduled at next revision because the old symbol stays valid until 15 Jun 2031." |
| 3 | Change Copilot | Submit change | "Plain English in, a schema-validated change set out, with evidence links and the required actions, including regulatory release gates." |
| 4 | Impact | Next | "Graph traversal: 1,152 labels × 8 markets × 26 languages × 3 packaging levels. Nothing is missed, and each edge carries its citation." |
| 5 | Compile | Compile 1,152 labels | "Compiled in milliseconds from 3 templates. Tap any element: source record → clause → symbol version → approval." |
| 6 | Verify | Run verification | "About 20,000 deterministic checks. It finds a German storage line saying 30 °C instead of 25, latent in the released labels, and a stale hard-coded shipper expiry." |
| 6b | Verify | Accept fixes | "The AI proposes the fix, the engineer accepts, the suite re-runs with zero failures. Barcodes are decoded back from the pixels." |
| 7 | Redline | Next | "Every changed pixel is mapped to the change that justifies it. The printer proof is registered, and an unintended REF change is caught before printing." |
| 8 | Approve | Collect signatures | "The risk score is 86/100 (High), so RA, QA, Clinical and Labeling sign. Signatures are Part 11-style, ECDSA-signed, and the change order is generated." |
| 9 | Release | Release | "One package to the LMS, eIFU, GUDID and EUDAMED. On the line, each label is decoded against its LBOM; try 'Simulate mix-up'." |
| 10 | Audit | Next | "A hash-chained ledger. Tamper with one record and verification fails at that record. Export the LBOM and W3C PROV." |
| ★ | Evidence | Finish | "69% of 218 real FDA labeling-recall events map to one of these controls. The modelled cycle time is −71%." |

Extra things to show judges, time permitting:
- the **Validation lab**: run 1,000 labels and show 100% recall on critical classes and 0 false positives;
- **Use camera** on a phone, pointed at a label on a laptop;
- **Poll eCFR live** on the RegWatch page.

---

## 5. Project structure

```
labeltwin/
├─ index.html, vite.config.ts, tsconfig.json, vercel.json, netlify.toml
├─ public/                 favicon, static headers
└─ src/
   ├─ main.tsx, App.tsx    shell, navigation, lazy-loaded pages
   ├─ styles.css           design tokens + components (responsive)
   ├─ engine/              real logic, framework-free
   │  ├─ gs1.ts            GS1 AI parsing/validation, check digits, dates
   │  ├─ compile.ts        label compiler + SVG renderer (bwip-js barcodes)
   │  ├─ verify.ts         Verification Suite (8 families, cited checks)
   │  ├─ raster.ts         SVG→pixels, zxing-wasm decode-back
   │  ├─ diff.ts           registration, pixel diff, semantic regions
   │  ├─ ledger.ts         SHA-256 hash chain, ECDSA e-signatures, LBOM hash
   │  ├─ risk.ts           explainable change-risk score + reviewer routing
   │  ├─ copilot.ts        change request → structured change set
   │  └─ golden.ts         defect-injected golden-set validation
   ├─ data/                sample data (swap these, see §6)
   │  ├─ products.ts       company, families, SKUs/GTINs, markets, levels, sources, conflicts
   │  ├─ requirements.ts   Requirement Graph (clauses, citations, applicability → elements)
   │  ├─ symbols.ts        versioned symbol library (ref, validity, glyph)
   │  ├─ phrases.ts        approved phrase library × languages, legacy TM defect
   │  ├─ regfeed.ts        regulatory intelligence items
   │  └─ evidence.ts       openFDA recall analysis + value-stream model
   ├─ state/               app state, scenario state machine, shared actions
   ├─ components/          UI kit, label viewer + provenance drawer, guided tour
   └─ pages/               one page per step (Sources … Audit, Insights, Validation, Architecture)
```

---

## 6. Swapping in new sample data

Everything the app shows comes from `src/data/*.ts`. These are typed, so the compiler tells you if a field is missing.

- **New product family:** add a `Family` to `FAMILIES` in `products.ts` (class, sterile method, shelf life, storage, MR status, markets, IFU). For a full SKU list, add a generator like `CF_SKUS`. The demo compiles the first family; change `FAMILIES[0]` in `state/store.tsx` and `engine/golden.ts`.
- **New market:** add it to `MARKETS` (name, flag, languages) and `MarketId`, then add requirements for it in `requirements.ts`.
- **New regulation or clause:** add a `Requirement` with `source`, `clause`, `url`, `applies(ctx)` and `requires: ElementId[]`. The compiler places the elements and the suite checks them automatically.
- **New symbol or symbol version:** add a `SymbolDef` in `symbols.ts`. Use `validUntil` + `supersededBy` to schedule a transition. The SYM-02 check and RegWatch pick it up.
- **New language or phrase:** add entries to `PHRASES` in `phrases.ts`, using `{t}` placeholders for numbers.
- **Regulatory feed items:** edit `REG_FEED` in `regfeed.ts`.
- **Evidence numbers:** `evidence.ts` holds the recall classification counts and the value-stream model.
- **Demo defects:** `LEGACY_TM_OVERRIDES` (phrases) and `shipperExpiryOverride` (in `state/store.tsx`) create the two defects in the story.

---

## 7. Licences of dependencies

React (MIT), Vite (MIT), bwip-js (MIT; BWIPP MIT), zxing-wasm (MIT; zxing-cpp Apache-2.0), pixelmatch (ISC). No non-commercial or AGPL components.
