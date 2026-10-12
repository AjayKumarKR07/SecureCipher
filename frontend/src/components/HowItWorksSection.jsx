import React from 'react';
import {
  BookOpen,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Sparkles,
  Lightbulb,
  Layers,
  HelpCircle,
  Terminal,
} from 'lucide-react';

/**
 * Reusable "How It Works" Educational Section Component
 * Provides a standardized, responsive, and beginner-friendly deep dive for every algorithm.
 */
export default function HowItWorksSection({
  algorithmName,
  subtitle,
  badge,
  warningBanner,
  purpose,
  diagramSteps = [],
  workflowSteps = [],
  concepts = [],
  example,
  securityNotes = [],
  keyTakeaway,
  themeColor = 'emerald',
}) {
  // Color configuration mapping
  const colorMap = {
    purple: {
      accentText: 'text-purple-400',
      accentBg: 'bg-purple-950/60',
      border: 'border-purple-500/30',
      cardHover: 'hover:border-purple-500/40',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      stepNum: 'bg-purple-600 text-white',
      diagramNode: 'border-purple-500/40 bg-purple-950/30 text-purple-200',
    },
    blue: {
      accentText: 'text-blue-400',
      accentBg: 'bg-blue-950/60',
      border: 'border-blue-500/30',
      cardHover: 'hover:border-blue-500/40',
      badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
      stepNum: 'bg-blue-600 text-white',
      diagramNode: 'border-blue-500/40 bg-blue-950/30 text-blue-200',
    },
    emerald: {
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-950/60',
      border: 'border-emerald-500/30',
      cardHover: 'hover:border-emerald-500/40',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      stepNum: 'bg-emerald-600 text-white',
      diagramNode: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
    },
    amber: {
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-950/60',
      border: 'border-amber-500/30',
      cardHover: 'hover:border-amber-500/40',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      stepNum: 'bg-amber-600 text-white',
      diagramNode: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
    },
    rose: {
      accentText: 'text-rose-400',
      accentBg: 'bg-rose-950/60',
      border: 'border-rose-500/30',
      cardHover: 'hover:border-rose-500/40',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      stepNum: 'bg-rose-600 text-white',
      diagramNode: 'border-rose-500/40 bg-rose-950/30 text-rose-200',
    },
    orange: {
      accentText: 'text-orange-400',
      accentBg: 'bg-orange-950/60',
      border: 'border-orange-500/30',
      cardHover: 'hover:border-orange-500/40',
      badge: 'bg-orange-950/80 text-orange-300 border-orange-500/40',
      stepNum: 'bg-orange-600 text-white',
      diagramNode: 'border-orange-500/40 bg-orange-950/30 text-orange-200',
    },
  };

  const theme = colorMap[themeColor] || colorMap.emerald;

  // Defensively normalize warningBanner (supports string or object)
  const normalizedWarning = typeof warningBanner === 'string'
    ? {
        type: themeColor === 'orange' || themeColor === 'rose' ? 'rose' : 'amber',
        headline: warningBanner.includes(':') ? warningBanner.split(':')[0].trim() : 'EDUCATIONAL USE ONLY',
        detail: warningBanner.includes(':') ? warningBanner.substring(warningBanner.indexOf(':') + 1).trim() : warningBanner,
      }
    : warningBanner;

  // Defensively normalize example (supports inputs array or input string, outputs array or output string)
  const normalizedExample = example
    ? {
        title: example.title || example.scenario || 'Illustrative Example',
        inputs: Array.isArray(example.inputs)
          ? example.inputs
          : example.input
          ? [{ label: 'Input Payload', value: String(example.input) }]
          : [],
        process: example.process || '',
        outputs: Array.isArray(example.outputs)
          ? example.outputs
          : example.output
          ? [{ label: 'Output Result', value: String(example.output) }]
          : [],
        note: example.note || '',
      }
    : null;

  // Defensively normalize securityNotes (supports array or { benefits, limitations } object)
  const normalizedSecurityNotes = Array.isArray(securityNotes)
    ? securityNotes
    : securityNotes && typeof securityNotes === 'object'
    ? [
        ...(securityNotes.benefits || []).map((b) => ({
          type: 'benefit',
          title: 'Cryptographic Benefit',
          description: b,
        })),
        ...(securityNotes.limitations || []).map((l) => ({
          type: 'warning',
          title: 'Security Limitation',
          description: l,
        })),
        ...(securityNotes.warning
          ? [
              {
                type: 'warning',
                title: 'Security Notice',
                description: securityNotes.warning,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-7 relative overflow-hidden">
      {/* Decorative subtle ambient backdrop glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Prominent Warning Banner (if algorithm is legacy/insecure) */}
      {normalizedWarning && (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 ${
            normalizedWarning.type === 'rose'
              ? 'border-rose-500/50 bg-rose-950/30 text-rose-200'
              : 'border-amber-500/50 bg-amber-950/30 text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              normalizedWarning.type === 'rose' ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
          <div className="text-xs leading-relaxed space-y-1">
            <strong
              className={`font-semibold uppercase tracking-wide block ${
                normalizedWarning.type === 'rose' ? 'text-rose-300' : 'text-amber-300'
              }`}
            >
              {normalizedWarning.headline}
            </strong>
            <p className="text-slate-300 text-[11px] m-0">{normalizedWarning.detail}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-lg ${theme.accentBg} border ${theme.border} ${theme.accentText}`}>
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight m-0 flex items-center gap-2">
              <span>How It Works: {algorithmName}</span>
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              {subtitle || 'Visual workflow, mathematical logic, and essential concepts explained simply.'}
            </p>
          </div>
        </div>
        {badge && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border self-start sm:self-auto ${theme.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {/* 1. Purpose Section */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
          <Sparkles className={`w-4 h-4 ${theme.accentText}`} />
          <span>1. Purpose & Application</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
          {purpose}
        </div>
      </div>

      {/* 2. Visual Workflow Diagram */}
      {diagramSteps && diagramSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <Layers className={`w-4 h-4 ${theme.accentText}`} />
            <span>2. Visual Workflow Pipeline</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 overflow-x-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 min-w-full">
              {diagramSteps.map((node, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex-1 w-full md:w-auto p-3.5 rounded-lg border bg-slate-900/80 border-slate-700/60 flex flex-col items-center text-center space-y-1.5 shadow-sm">
                    {node.icon && (
                      <div className={`p-2 rounded-md bg-slate-950 border border-slate-800 ${theme.accentText}`}>
                        <node.icon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-white">{node.title}</span>
                    <span className="text-[11px] text-slate-400 leading-tight font-mono">{node.subtitle}</span>
                  </div>

                  {idx < diagramSteps.length - 1 && (
                    <div className="shrink-0 text-slate-500 py-1 md:py-0">
                      <span className="hidden md:inline-block">
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </span>
                      <span className="inline-block md:hidden">
                        <ArrowDown className="w-4 h-4 text-slate-500" />
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Step-by-Step Execution Workflow */}
      {workflowSteps && workflowSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <Cpu className={`w-4 h-4 ${theme.accentText}`} />
            <span>3. Step-by-Step Execution Flow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {workflowSteps.map((stepItem, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors"
              >
                <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-mono ${theme.stepNum}`}>
                  {idx + 1}
                </span>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{stepItem.title}</span>
                    {stepItem.tag && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {stepItem.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed m-0">{stepItem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Important Concepts & Technical Terminology */}
      {concepts && concepts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <HelpCircle className={`w-4 h-4 ${theme.accentText}`} />
            <span>4. Key Concepts & Terminology</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {concepts.map((concept, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white m-0">{concept.term}</h4>
                  {concept.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {concept.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed m-0">{concept.definition || concept.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Illustrative Real-World Example */}
      {normalizedExample && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <Terminal className={`w-4 h-4 ${theme.accentText}`} />
            <span>5. Illustrative Example</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span>Scenario: {normalizedExample.title}</span>
              <span className="text-amber-400/90 text-[10px] italic">Educational Representation (No Real Secrets)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Input / Setup:</span>
                <div className="text-slate-200 break-all space-y-0.5">
                  {normalizedExample.inputs.map((inp, idx) => (
                    <div key={idx}><strong className="text-slate-400">{inp.label}:</strong> {inp.value}</div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Internal Processing:</span>
                <div className="text-slate-300 leading-relaxed font-sans text-xs">
                  {normalizedExample.process}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Output Result:</span>
                <div className="text-slate-200 break-all space-y-0.5">
                  {normalizedExample.outputs.map((out, idx) => (
                    <div key={idx}><strong className="text-slate-400">{out.label}:</strong> {out.value}</div>
                  ))}
                </div>
              </div>
            </div>

            {normalizedExample.note && (
              <p className="text-[11px] text-slate-400 italic m-0 pt-1 border-t border-slate-800/80">
                {normalizedExample.note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. Security Notes: Benefits & Limitations */}
      {normalizedSecurityNotes && normalizedSecurityNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <ShieldCheck className={`w-4 h-4 ${theme.accentText}`} />
            <span>6. Security Benefits & Limitations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {normalizedSecurityNotes.map((note, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  note.type === 'benefit'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : note.type === 'warning'
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                {note.type === 'benefit' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : note.type === 'warning' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-relaxed">
                  <strong className="block mb-0.5 text-white">{note.title}</strong>
                  <span className="text-slate-300">{note.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Key Takeaway */}
      {keyTakeaway && (
        <div className="rounded-xl border border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/30 p-4 flex items-center gap-3 shadow-md">
          <span className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${theme.accentText} shrink-0`}>
            <Lightbulb className="w-4 h-4" />
          </span>
          <div className="text-xs">
            <strong className="text-slate-200 font-bold block text-[11px] uppercase tracking-wider font-mono">
              Key Takeaway:
            </strong>
            <p className="text-white text-xs sm:text-sm font-medium mt-0.5 m-0 leading-relaxed">
              {keyTakeaway}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
