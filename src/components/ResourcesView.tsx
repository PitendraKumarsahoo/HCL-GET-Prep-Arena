import { useState, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { RESOURCE_LINKS } from '../data';
import type { ResourceLink } from '../types/prep';

const CATEGORIES: Array<'All' | ResourceLink['category']> = [
  'All',
  'Official HCLTech',
  'Candidate Experiences',
  'PYQs & Mocks',
  'Coding Platforms',
  'Aptitude Prep',
  'SQL Mastery',
  'Java & OOP',
  'OS, DBMS & CN',
  'Spoken English (Versant)',
];

export function ResourcesView() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ResourceLink['category']>('All');

  const items = useMemo(
    () =>
      selectedCategory === 'All'
        ? RESOURCE_LINKS
        : RESOURCE_LINKS.filter((r) => r.category === selectedCategory),
    [selectedCategory]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Official Portals & Verified Free Study Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {RESOURCE_LINKS.length} curated external portals covering HCLTech campus hiring, PYQ archives, SQL sandboxes, Java/Spring docs, and Versant spoken drills
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 flex flex-col justify-between transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {link.category} · {link.tag}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </div>
              <h2 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                {link.title}
              </h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {link.description}
              </p>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400 truncate">
              {link.url}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
