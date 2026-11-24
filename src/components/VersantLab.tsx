import { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, Mic, Square, CheckCircle2, RotateCcw } from 'lucide-react';
import { VERSANT_DRILLS } from '../data';
import type { VersantDrill } from '../types/prep';

interface VersantLabProps {
  completedIds: string[];
  onToggleComplete: (id: string) => void;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const PARTS: Array<VersantDrill['part']> = [
  'Reading Aloud',
  'Repeat Sentence',
  'Sentence Builds',
  'Short Answer',
];

export function VersantLab({ completedIds, onToggleComplete }: VersantLabProps) {
  const [selectedPart, setSelectedPart] = useState<VersantDrill['part']>('Reading Aloud');
  const [selectedId, setSelectedId] = useState<string>(VERSANT_DRILLS[0].id);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [checkedRubric, setCheckedRubric] = useState<Record<number, boolean>>({});

  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const partDrills = useMemo(
    () => VERSANT_DRILLS.filter((d) => d.part === selectedPart),
    [selectedPart]
  );

  const activeDrill = useMemo(
    () => partDrills.find((d) => d.id === selectedId) ?? partDrills[0],
    [partDrills, selectedId]
  );

  const speechSynthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechRecCtor: SpeechRecognitionCtor | null = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    setTranscript('');
    setRecordSeconds(0);
    setMicNote(null);
    setShowModel(false);
    setCheckedRubric({});
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  }, [activeDrill.id]);

  const handlePlayPrompt = () => {
    if (!speechSynthSupported) return;
    window.speechSynthesis.cancel();
    const spokenText =
      activeDrill.part === 'Sentence Builds' && activeDrill.phrases
        ? activeDrill.phrases.join(' ... ')
        : activeDrill.modelAnswer && activeDrill.part === 'Repeat Sentence'
        ? activeDrill.modelAnswer
        : activeDrill.prompt;
    const utt = new SpeechSynthesisUtterance(spokenText);
    utt.lang = 'en-US';
    utt.rate = speechRate;
    window.speechSynthesis.speak(utt);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!speechRecCtor) {
      setMicNote(
        'Browser Web Speech Recognition is unavailable here (Firefox or restricted frame). Practice speaking aloud with the pacing timer or type your response below for WPM and self-rubric checks.'
      );
      setIsRecording(true);
      return;
    }

    try {
      const rec = new speechRecCtor();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (ev) => {
        const parts: string[] = [];
        for (let i = 0; i < ev.results.length; i++) {
          parts.push(ev.results[i][0].transcript);
        }
        setTranscript(parts.join(' ').trim());
      };
      rec.onerror = (ev) => {
        setMicNote(`Microphone capture note (${ev.error}). You can type or speak manually below.`);
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
      setMicNote(null);
      setRecordSeconds(0);
      rec.start();
      setIsRecording(true);
    } catch {
      setMicNote('Could not start SpeechRecognition; manual speaking timer active.');
      setIsRecording(true);
    }
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const wpm = recordSeconds > 0 && wordCount > 0 ? Math.round((wordCount / recordSeconds) * 60) : 0;
  const isDone = completedIds.includes(activeDrill.id);

  return (
    <div className="space-y-5">
      {/* Info & Part Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Versant Speaking & Listening Practice
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official HCL Ascend qualifying score ~46–56/80 · Browser Web Speech API practice + self-rating rubric (real Versant uses automated Pearson scoring)
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
            {completedIds.length} / {VERSANT_DRILLS.length} drills completed
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          {PARTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSelectedPart(p);
                const first = VERSANT_DRILLS.find((d) => d.part === p);
                if (first) setSelectedId(first.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                selectedPart === p
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Drill Selector List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
            {selectedPart} Drills ({partDrills.length})
          </p>
          <div className="space-y-1.5">
            {partDrills.map((d, idx) => {
              const active = d.id === activeDrill.id;
              const done = completedIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/50 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="line-clamp-2 leading-relaxed">
                    <span className="font-mono font-semibold mr-1.5">#{idx + 1}</span>
                    {d.prompt}
                  </span>
                  {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Practice Stage */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeDrill.part}</p>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                Speaking Drill
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-600 dark:text-slate-300">
                Speed:
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="ml-1.5 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value={0.85}>0.85x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={1.15}>1.15x</option>
                </select>
              </label>

              <button
                type="button"
                disabled={!speechSynthSupported}
                onClick={handlePlayPrompt}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Volume2 className="w-4 h-4" />
                Play Audio Prompt
              </button>
            </div>
          </div>

          {/* Prompt Display */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              {activeDrill.part === 'Repeat Sentence' && !showModel
                ? 'Click "Play Audio Prompt" above, listen carefully once, and repeat word-for-word.'
                : activeDrill.prompt}
            </p>

            {activeDrill.phrases && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeDrill.phrases.map((ph, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                  >
                    "{ph}"
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Microphone Capture & Transcript */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? `Stop Recording (${recordSeconds}s)` : 'Start Speaking'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setRecordSeconds(0);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Duration: {recordSeconds}s · Words: {wordCount} {wpm > 0 ? `· ~${wpm} WPM` : ''}
              </span>
            </div>

            {micNote && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                {micNote}
              </p>
            )}

            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Live speech transcript appears here automatically when Web Speech API is supported—or type/edit your spoken response to review accuracy."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Model Answer & Self-Rating Checklist */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {activeDrill.modelAnswer && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowModel((m) => !m)}
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showModel ? 'Hide Reference Sentence / Model Answer' : 'Show Reference Sentence / Model Answer'}
                </button>
                {showModel && (
                  <p className="mt-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {activeDrill.modelAnswer}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Self-Rating Checklist (Target 100% before marking complete)
              </p>
              <div className="space-y-2">
                {activeDrill.rubricChecklist.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedRubric[idx]}
                      onChange={() =>
                        setCheckedRubric((p) => ({ ...p, [idx]: !p[idx] }))
                      }
                      className="mt-1 rounded border-slate-300 dark:border-slate-600 text-blue-700"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onToggleComplete(activeDrill.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                }`}
              >
                {isDone ? 'Completed ✓' : 'Mark Drill Completed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
