#!/usr/bin/env node
/**
 * Strict Question Bank Deduplication Gate (HCL GET Prep Arena)
 * - Normalizes text (lowercase, strip punctuation/extra whitespace)
 * - Checks exact duplicate IDs and exact duplicate normalized prompts
 * - Checks fuzzy duplicates via token Jaccard similarity > 0.7
 * - Checks cross-set isolation (Full Mocks must not reuse any item from practice sets)
 * - Exits with code 1 if ANY duplicate or violation is found.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'and', 'or',
  'that', 'this', 'which', 'what', 'when', 'where', 'who', 'how', 'if',
  'then', 'else', 'find', 'calculate', 'determine', 'following', 'given'
]);

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, (m) => m)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  const norm = normalizeText(str);
  if (!norm) return new Set();
  const tokens = norm.split(' ').filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (tokens.length === 0) return new Set(norm.split(' '));
  return new Set(tokens);
}

function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectAllItems() {
  const items = [];

  // 1. Aptitude sets
  const aptDir = path.join(DATA_DIR, 'aptitude');
  if (fs.existsSync(aptDir)) {
    for (const file of fs.readdirSync(aptDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(aptDir, file));
      if (!data?.questions) continue;
      for (const q of data.questions) {
        items.push({
          bucket: 'aptitude',
          sourceFile: `aptitude/${file}`,
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          source_tag: q.source_tag,
          compareText: `${q.question} ${q.options?.join(' ') || ''}`,
          stemText: `${q.question}`,
        });
      }
    }
  }

  // 2. Technical MCQ sets
  const techDir = path.join(DATA_DIR, 'technical');
  if (fs.existsSync(techDir)) {
    for (const file of fs.readdirSync(techDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(techDir, file));
      if (!data?.questions) continue;
      for (const q of data.questions) {
        items.push({
          bucket: 'technical',
          sourceFile: `technical/${file}`,
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          source_tag: q.source_tag,
          compareText: `${q.question} ${q.codeSnippet || ''} ${q.options?.join(' ') || ''}`,
          stemText: `${q.question} ${q.codeSnippet || ''}`,
        });
      }
    }
  }

  // 3. Coding sets
  const codingDir = path.join(DATA_DIR, 'coding');
  if (fs.existsSync(codingDir)) {
    for (const file of fs.readdirSync(codingDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(codingDir, file));
      if (!data?.problems) continue;
      for (const p of data.problems) {
        items.push({
          bucket: 'coding',
          sourceFile: `coding/${file}`,
          id: p.id,
          topic: p.topic,
          difficulty: p.difficulty,
          source_tag: p.source_tag,
          compareText: `${p.title} ${p.statement}`,
          stemText: `${p.title} ${p.statement}`,
        });
      }
    }
  }

  // 4. SQL sets
  const sqlDir = path.join(DATA_DIR, 'sql');
  if (fs.existsSync(sqlDir)) {
    for (const file of fs.readdirSync(sqlDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(sqlDir, file));
      if (!data?.queries) continue;
      for (const q of data.queries) {
        items.push({
          bucket: 'sql',
          sourceFile: `sql/${file}`,
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          source_tag: q.source_tag,
          compareText: `${q.title} ${q.prompt} ${q.solutionSql}`,
          stemText: `${q.title} ${q.prompt}`,
        });
      }
    }
  }

  // 5. Full Mocks
  const mocksDir = path.join(DATA_DIR, 'mocks');
  if (fs.existsSync(mocksDir)) {
    for (const file of fs.readdirSync(mocksDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(mocksDir, file));
      if (!data) continue;
      for (const q of data.aptitudeQuestions || []) {
        items.push({
          bucket: 'mock-aptitude',
          sourceFile: `mocks/${file}`,
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          source_tag: q.source_tag,
          compareText: `${q.question} ${q.options?.join(' ') || ''}`,
          stemText: `${q.question}`,
        });
      }
      for (const q of data.technicalQuestions || []) {
        items.push({
          bucket: 'mock-technical',
          sourceFile: `mocks/${file}`,
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          source_tag: q.source_tag,
          compareText: `${q.question} ${q.codeSnippet || ''} ${q.options?.join(' ') || ''}`,
          stemText: `${q.question} ${q.codeSnippet || ''}`,
        });
      }
      for (const p of data.codingProblems || []) {
        items.push({
          bucket: 'mock-coding',
          sourceFile: `mocks/${file}`,
          id: p.id,
          topic: p.topic,
          difficulty: p.difficulty,
          source_tag: p.source_tag,
          compareText: `${p.title} ${p.statement}`,
          stemText: `${p.title} ${p.statement}`,
        });
      }
    }
  }

  // 6. Interview Bank
  const intDir = path.join(DATA_DIR, 'interview');
  if (fs.existsSync(intDir)) {
    for (const file of fs.readdirSync(intDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = readJsonIfExists(path.join(intDir, file));
      if (!Array.isArray(data)) continue;
      for (const qa of data) {
        items.push({
          bucket: `interview-${qa.category?.toLowerCase() || 'misc'}`,
          sourceFile: `interview/${file}`,
          id: qa.id,
          topic: qa.topic,
          difficulty: qa.difficulty,
          source_tag: qa.source_tag,
          compareText: `${qa.question}`,
          stemText: `${qa.question}`,
        });
      }
    }
  }

  return items;
}

function runDedupe() {
  const items = collectAllItems();
  const idMap = new Map();
  const exactStemMap = new Map();
  const exactCompareMap = new Map();

  const duplicateIds = [];
  const exactDuplicates = [];
  const fuzzyDuplicates = [];

  const prepared = items.map((item) => ({
    ...item,
    normStem: normalizeText(item.stemText),
    normCompare: normalizeText(item.compareText),
    tokens: tokenize(item.stemText),
  }));

  for (let i = 0; i < prepared.length; i++) {
    const cur = prepared[i];

    if (idMap.has(cur.id)) {
      duplicateIds.push({ id: cur.id, a: idMap.get(cur.id), b: cur.sourceFile });
    } else {
      idMap.set(cur.id, cur.sourceFile);
    }

    if (exactStemMap.has(cur.normStem)) {
      const prev = exactStemMap.get(cur.normStem);
      exactDuplicates.push({
        type: 'exact-stem',
        a: `${prev.sourceFile} [${prev.id}]`,
        b: `${cur.sourceFile} [${cur.id}]`,
        preview: cur.stemText.slice(0, 90),
      });
    } else {
      exactStemMap.set(cur.normStem, cur);
    }

    if (exactCompareMap.has(cur.normCompare)) {
      const prev = exactCompareMap.get(cur.normCompare);
      if (prev.id !== cur.id) {
        exactDuplicates.push({
          type: 'exact-full',
          a: `${prev.sourceFile} [${prev.id}]`,
          b: `${cur.sourceFile} [${cur.id}]`,
          preview: cur.compareText.slice(0, 90),
        });
      }
    } else {
      exactCompareMap.set(cur.normCompare, cur);
    }
  }

  // Pairwise Jaccard within compatible categories AND between practice sets and mocks
  // Note: We allow comparing across ALL MCQ/coding/sql items, and within interview bank separately
  // (since an interview concept like "What is polymorphism?" might also have a technical MCQ output snippet,
  // we still check same-modality + cross-mock pairs!). Wait: let's check ALL items against ALL items!
  // Let's compare within same modality (MCQ/mock-MCQ, coding/mock-coding, sql, interview) AND check stems across all.
  for (let i = 0; i < prepared.length; i++) {
    const a = prepared[i];
    if (a.tokens.size < 4) continue;
    for (let j = i + 1; j < prepared.length; j++) {
      const b = prepared[j];
      if (b.tokens.size < 4) continue;

      // Skip comparing interview short questions against long reading comprehension passages if unrelated,
      // actually Jaccard naturally handles length differences (<0.7), so comparing everything is safe!
      const sim = jaccard(a.tokens, b.tokens);
      if (sim > 0.7) {
        fuzzyDuplicates.push({
          similarity: Number(sim.toFixed(3)),
          a: `${a.sourceFile} [${a.id}]`,
          b: `${b.sourceFile} [${b.id}]`,
          textA: a.stemText.slice(0, 80),
          textB: b.stemText.slice(0, 80),
        });
      }
    }
  }

  const bucketCounts = {};
  for (const item of prepared) {
    bucketCounts[item.bucket] = (bucketCounts[item.bucket] || 0) + 1;
  }

  console.log('=== HCL GET Prep Arena Dedupe Report ===');
  console.log(`Total items scanned: ${prepared.length}`);
  console.log('Counts by bucket:', JSON.stringify(bucketCounts, null, 2));
  console.log(`Duplicate IDs: ${duplicateIds.length}`);
  console.log(`Exact Duplicates: ${exactDuplicates.length}`);
  console.log(`Fuzzy Duplicates (Jaccard > 0.70): ${fuzzyDuplicates.length}`);

  if (duplicateIds.length > 0) {
    console.error('\n[FAIL] Duplicate IDs:', duplicateIds.slice(0, 20));
  }
  if (exactDuplicates.length > 0) {
    console.error('\n[FAIL] Exact Duplicates:', exactDuplicates.slice(0, 20));
  }
  if (fuzzyDuplicates.length > 0) {
    console.error('\n[FAIL] Fuzzy Duplicates (Jaccard > 0.70):', fuzzyDuplicates.slice(0, 20));
  }

  if (duplicateIds.length > 0 || exactDuplicates.length > 0 || fuzzyDuplicates.length > 0) {
    console.error('\nDEDUPE CHECK FAILED. Fix duplicates before building.');
    process.exit(1);
  }

  console.log('\n[PASS] Zero exact or fuzzy (>0.70 Jaccard) duplicates detected across all sets.');
}

runDedupe();
