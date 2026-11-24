import { useState, useEffect, useId } from 'react';
import mermaid from 'mermaid';
import { CONCEPT_DIAGRAMS } from '../data';
import type { ConceptDiagram } from '../types/prep';

interface ConceptsViewProps {
  theme: 'light' | 'dark';
}

const SUBJECTS: Array<'All' | ConceptDiagram['subject']> = [
  'All',
  'Java',
  'DBMS',
  'OS',
  'CN',
  'Spring Boot & REST',
];

function MermaidCanvas({ code, theme }: { code: string; theme: 'light' | 'dark' }) {
  const uniqueId = useId().replace(/:/g, '_');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'strict',
    });

    mermaid
      .render(`mmd_${uniqueId}_${theme}`, code)
      .then((res) => {
        if (active) {
          setSvgHtml(res.svg);
          setErr(null);
        }
      })
      .catch((e) => {
        if (active) {
          setErr(e instanceof Error ? e.message : 'Diagram render error');
        }
      });

    return () => {
      active = false;
    };
  }, [code, theme, uniqueId]);

  if (err) {
    return (
      <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
        {code}
      </pre>
    );
  }

  return (
    <div
      className="w-full overflow-x-auto p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-center"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

export function ConceptsView({ theme }: ConceptsViewProps) {
  const [subject, setSubject] = useState<'All' | ConceptDiagram['subject']>('All');
  const filtered =
    subject === 'All'
      ? CONCEPT_DIAGRAMS
      : CONCEPT_DIAGRAMS.filter((c) => c.subject === subject);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Interactive Architecture & CS Concept Cards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visual Mermaid flowcharts paired with mental analogies and campus MCQ/interview traps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                subject === s
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map((card) => (
          <article
            key={card.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.subject}</p>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {card.summary}
              </p>
            </div>

            <MermaidCanvas code={card.mermaidCode} theme={theme} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              <div className="lg:col-span-5 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Real-World Analogy
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.analogy}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Common Exam & Interview Trap
                  </h3>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    {card.examTrap}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  High-Yield Takeaways
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {card.keyTakeaways.map((kt, idx) => (
                    <li key={idx}>{kt}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
