# HCL GET Prep Arena

Full-featured placement practice platform tailored to the **HCLTech Graduate Engineer Trainee (GET — Application Development)** campus recruitment drive, built with React, TypeScript, Vite, Tailwind CSS, Monaco Editor, Recharts, Mermaid, and `sql.js`.

## Implemented Preparation Modes

1. **Mode 1 — Ascend Cognitive (8 sets × 30 Qs = 240 Qs, 90 min/set):** Quantitative Aptitude, Logical Reasoning, and Verbal Ability with shortcuts and detailed explanations.
2. **Mode 2 — Technical MCQ (8 sets × 25 Qs = 200 Qs):** Java internals, Output Prediction, OOP, DBMS, SQL, OS, CN, DSA, SE, and JDBC.
3. **Mode 3 — Coding Lab & SQL Lab:**
   - **Coding Lab (12 sets × 2 problems = 24 problems):** 2 sample + 5 hidden test cases each, Java/Python reference solutions, C++ starter templates, complexity & edge cases, and Piston sandbox execution.
   - **SQL Lab (8 sets × 5 queries = 40 queries):** Real client-side SQLite3 execution (`sql.js` WebAssembly) against `CREATE TABLE` + `INSERT` seed schemas with automated column/row verification.
4. **Mode 4 — Versant Speaking & Listening (24 drills):** Reading Aloud, Repeat Sentence, Sentence Builds, and Short Answer via browser Web Speech API (`speechSynthesis` + `SpeechRecognition` with manual fallback), pacing timer, WPM indicator, and self-rating rubric checklists.
5. **Mode 5 — Full Mocks & Interview Bank:**
   - **5 Full Mocks (75 items / 90 min each = 375 unseen items):** 37 Aptitude + 36 Technical MCQ + 2 embedded Coding problems with zero overlap against practice sets.
   - **Interview Bank (150 Technical + 40 HR Q&As):** Covers Java, Spring Boot, SQL, DBMS, OS, CN, DSA, ML basics, MERN/React basics, and campus HR scenarios.
6. **Concept Diagrams & Curated Resources:** 10 interactive Mermaid architecture/CS flow diagrams and 32 official/free study links.

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Quality Gates & Verification

- **Deduplication Gate (`npm run dedupe`):** Normalizes all prompts across all 1,069 graded items and enforces zero duplicate IDs, zero exact duplicates, and zero fuzzy duplicates (`Jaccard > 0.70`). Automatically runs before `vite build`.
- **Execution Verification (`npm run verify-bank`):** Runs every coding problem's Python reference solution against all 7 test cases (238 total cases across Coding Lab + Full Mocks) and runs every SQL solution against SQLite3 (`schemaSql + seedSql`) to verify exact columns and rows.

## Build & Static Deployment (Vercel / Render / Netlify)

```bash
npm run build
```

- `npm run build` executes `node scripts/dedupe.js && vite build`, producing the static bundle in `dist/` (including `/sql-wasm.wasm` from `public/`).
- **Vercel:** Framework Preset `Vite`, Build Command `npm run build`, Output Directory `dist`.
- **Render (Static Site):** Build Command `npm install && npm run build`, Publish Directory `dist`.

## Verification & Pattern Scope Notes

- All 240 Coding/Mock test cases and all 40 SQL lab queries were programmatically verified locally via Python 3 and SQLite 3.40 (`scripts/verify-bank.mjs`). Java reference solutions mirror verified Python logic; `javac` is not present in the build sandbox, and in-browser code execution uses the public Piston API when online.
- Question items tagged `reported` mirror publicly reported HCLTech/campus placement patterns, while `pyq-style` items are original practice questions calibrated to equal or higher difficulty.
- Official Ascend rounds test Cognitive, Coding/Technical, and Versant; exact question counts and zero negative marking reflect student-reported campus drives (negative marking `-0.25` is toggleable inside the test runner).
