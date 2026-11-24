#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8'));
}

function summarizeItems(label, items) {
  const diff = { medium: 0, 'medium-hard': 0, hard: 0 };
  const src = { reported: 0, 'pyq-style': 0 };
  const topics = {};
  for (const item of items) {
    if (item.difficulty) diff[item.difficulty] = (diff[item.difficulty] || 0) + 1;
    if (item.source_tag) src[item.source_tag] = (src[item.source_tag] || 0) + 1;
    if (item.topic) topics[item.topic] = (topics[item.topic] || 0) + 1;
  }
  const n = items.length;
  const pct = (v) => (n ? ((v / n) * 100).toFixed(1) + '%' : '0%');
  return {
    Category: label,
    Count: n,
    Medium: `${diff.medium} (${pct(diff.medium)})`,
    MedHard: `${diff['medium-hard']} (${pct(diff['medium-hard'])})`,
    Hard: `${diff.hard} (${pct(diff.hard)})`,
    Reported: src.reported,
    PyqStyle: src['pyq-style'],
    Topics: Object.keys(topics).length,
  };
}

const aptItems = [];
for (const f of fs.readdirSync(path.join(DATA_DIR, 'aptitude')).sort()) {
  if (f.endsWith('.json')) aptItems.push(...readJson(`aptitude/${f}`).questions);
}

const techItems = [];
for (const f of fs.readdirSync(path.join(DATA_DIR, 'technical')).sort()) {
  if (f.endsWith('.json')) techItems.push(...readJson(`technical/${f}`).questions);
}

const codingItems = [];
for (const f of fs.readdirSync(path.join(DATA_DIR, 'coding')).sort()) {
  if (f.endsWith('.json')) codingItems.push(...readJson(`coding/${f}`).problems);
}

const sqlItems = [];
for (const f of fs.readdirSync(path.join(DATA_DIR, 'sql')).sort()) {
  if (f.endsWith('.json')) sqlItems.push(...readJson(`sql/${f}`).queries);
}

const mockMcqItems = [];
const mockCodingItems = [];
for (const f of fs.readdirSync(path.join(DATA_DIR, 'mocks')).sort()) {
  if (f.endsWith('.json')) {
    const m = readJson(`mocks/${f}`);
    mockMcqItems.push(...m.aptitudeQuestions, ...m.technicalQuestions);
    mockCodingItems.push(...m.codingProblems);
  }
}

const intTech = readJson('interview/technical.json');
const intHr = readJson('interview/hr.json');
const versant = readJson('versant/drills.json');
const diagrams = readJson('concepts/diagrams.json');
const resources = readJson('resources.json');

const rows = [
  summarizeItems('Aptitude (8 sets x 30)', aptItems),
  summarizeItems('Technical MCQ (8 sets x 25)', techItems),
  summarizeItems('Coding Lab (12 sets x 2)', codingItems),
  summarizeItems('SQL Lab (8 sets x 5)', sqlItems),
  summarizeItems('Full Mocks MCQ (5 x 73)', mockMcqItems),
  summarizeItems('Full Mocks Coding (5 x 2)', mockCodingItems),
  summarizeItems('Interview Tech Q&A', intTech),
  summarizeItems('Interview HR Q&A', intHr),
];

const allTagged = [
  ...aptItems,
  ...techItems,
  ...codingItems,
  ...sqlItems,
  ...mockMcqItems,
  ...mockCodingItems,
  ...intTech,
  ...intHr,
];
rows.push(summarizeItems('TOTAL GRADED BANK', allTagged));

console.log('=== HCL GET Prep Arena Coverage Report ===');
console.table(rows);
console.log(
  `Supplementary Modules -> Versant Drills: ${versant.length} | Concept Diagrams: ${diagrams.length} | Curated Links: ${resources.length}`
);
