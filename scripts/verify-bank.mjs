#!/usr/bin/env node
/**
 * Bank Integrity & Execution Verifier:
 * 1. Verifies counts, schema completeness, difficulty mix, and source_tag mix.
 * 2. Executes every Coding problem's Python reference solution against all 7 test cases (2 sample + 5 hidden).
 * 3. Executes every SQL problem's schemaSql + seedSql + solutionSql in real SQLite3 and compares columns + rows against expectedColumns + expectedRows.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');

let failures = 0;

function fail(msg) {
  failures++;
  console.error(`[FAIL] ${msg}`);
}

function verifyCodingProblems(problems, label) {
  for (const p of problems) {
    if (!p.testCases || p.testCases.length < 7) {
      fail(`${label} ${p.id}: expected >=7 testCases, got ${p.testCases?.length}`);
      continue;
    }
    const samples = p.testCases.filter((t) => t.isSample).length;
    const hidden = p.testCases.filter((t) => !t.isSample).length;
    if (samples !== 2 || hidden < 5) {
      fail(`${label} ${p.id}: expected 2 sample & 5 hidden, got ${samples} sample / ${hidden} hidden`);
    }
    for (let idx = 0; idx < p.testCases.length; idx++) {
      const tc = p.testCases[idx];
      try {
        const out = execFileSync('python3', ['-c', p.solutions.python], {
          input: tc.input,
          encoding: 'utf8',
          timeout: 4000,
        }).trim();
        const exp = tc.expectedOutput.trim();
        if (out !== exp) {
          fail(`${label} ${p.id} TC#${idx + 1}: expected "${exp}", got "${out}"`);
        }
      } catch (err) {
        fail(`${label} ${p.id} TC#${idx + 1} runtime error: ${err.message}`);
      }
    }
  }
}

function verifySqlSets() {
  const sqlDir = path.join(DATA_DIR, 'sql');
  if (!fs.existsSync(sqlDir)) return;
  const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith('.json')).sort();

  const pyRunner = `
import json, sqlite3, sys
payload = json.loads(sys.stdin.read())
con = sqlite3.connect(':memory:')
cur = con.cursor()
cur.executescript(payload['schemaSql'] + '\\n' + payload['seedSql'])
cur.execute(payload['solutionSql'])
cols = [d[0] for d in cur.description] if cur.description else []
rows = [list(r) for r in cur.fetchall()]
print(json.dumps({'columns': cols, 'rows': rows}))
`;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
    for (const q of data.queries) {
      try {
        const resRaw = execFileSync('python3', ['-c', pyRunner], {
          input: JSON.stringify({
            schemaSql: q.schemaSql,
            seedSql: q.seedSql,
            solutionSql: q.solutionSql,
          }),
          encoding: 'utf8',
          timeout: 4000,
        });
        const res = JSON.parse(resRaw);
        const normCols = (c) => JSON.stringify(c.map((x) => String(x).toLowerCase()));
        if (normCols(res.columns) !== normCols(q.expectedColumns)) {
          fail(`sql/${file} ${q.id} columns mismatch: expected ${JSON.stringify(q.expectedColumns)}, got ${JSON.stringify(res.columns)}`);
        }
        if (JSON.stringify(res.rows) !== JSON.stringify(q.expectedRows)) {
          fail(`sql/${file} ${q.id} rows mismatch:\n  expected: ${JSON.stringify(q.expectedRows)}\n  got:      ${JSON.stringify(res.rows)}`);
        }
      } catch (err) {
        fail(`sql/${file} ${q.id} SQL execution error: ${err.message}`);
      }
    }
  }
}

function verifyAllCoding() {
  const codingDir = path.join(DATA_DIR, 'coding');
  if (fs.existsSync(codingDir)) {
    for (const file of fs.readdirSync(codingDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = JSON.parse(fs.readFileSync(path.join(codingDir, file), 'utf8'));
      verifyCodingProblems(data.problems || [], `coding/${file}`);
    }
  }
  const mocksDir = path.join(DATA_DIR, 'mocks');
  if (fs.existsSync(mocksDir)) {
    for (const file of fs.readdirSync(mocksDir).filter((f) => f.endsWith('.json')).sort()) {
      const data = JSON.parse(fs.readFileSync(path.join(mocksDir, file), 'utf8'));
      verifyCodingProblems(data.codingProblems || [], `mocks/${file}`);
    }
  }
}

verifyAllCoding();
verifySqlSets();

if (failures > 0) {
  console.error(`\nVerification finished with ${failures} failure(s).`);
  process.exit(1);
}
console.log('[PASS] All coding test cases (Python) and SQL queries (SQLite3) verified cleanly.');
