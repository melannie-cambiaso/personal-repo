"use client";

import { useState } from "react";
import type { LeafDeviation, MonthAnalysis, NextMonthOverrun } from "@/features/finance-v2/domain";
import { isOverrun } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface Props {
  /** `null` while the viewed month's transactions are still loading. Analyzing a
   *  not-yet-loaded month would read as zero spend — every category comfortably
   *  under budget, the exact opposite of what an overrun month looks like — so
   *  this tab withholds the whole analysis rather than show a reassuring lie
   *  (same rationale as `LoadingSpend`'s design D7). */
  analysis: MonthAnalysis | null;
}

// `formatCLP` renders a negative as "$-8.000". A deviation column is SCANNED for
// direction before it is read for magnitude, so the sign leads and the currency
// symbol stays attached to the number. Zero carries no sign — it is neither.
function formatSigned(amount: number): string {
  if (amount === 0) return formatCLP(0);
  return `${amount > 0 ? "+" : "-"}${formatCLP(Math.abs(amount))}`;
}

// A subcategory is only identifiable next to its parent: two categories can each
// own a "Luz", and the deviation list flattens both into one ranking.
function leafLabel(leaf: { name: string; parentName?: string }): string {
  return leaf.parentName ? `${leaf.parentName} · ${leaf.name}` : leaf.name;
}

// Full class strings (not interpolated tone names) so Tailwind can see every one.
const SECTION_TONES = {
  sage: {
    panel: "border-sage-300 bg-sage-100",
    circle: "bg-sage-500",
    inner: "border-sage-300",
  },
  lilac: {
    panel: "border-lilac-300 bg-lilac-100",
    circle: "bg-lilac-500",
    inner: "border-lilac-300",
  },
  blush: {
    panel: "border-blush-300 bg-blush-100",
    circle: "bg-blush-500",
    inner: "border-blush-300",
  },
};

// The icon sits beside the heading, not inside it, so the heading's text stays
// exactly its title.
function Section({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: string;
  tone: keyof typeof SECTION_TONES;
  children: React.ReactNode;
}) {
  const classes = SECTION_TONES[tone];
  return (
    <div className={`${classes.panel} flex flex-col gap-4 rounded-3xl border-2 p-5`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`${classes.circle} flex size-10 shrink-0 items-center justify-center rounded-full text-xl`}
        >
          {icon}
        </span>
        <h3 className="text-brown-900 text-2xl font-semibold tracking-tight">
          {title}
        </h3>
      </div>
      <div
        className={`${classes.inner} bg-cream-50/70 flex flex-col gap-3 rounded-2xl border-2 px-4 py-3`}
      >
        {children}
      </div>
    </div>
  );
}

// Label and value are siblings, never nested: the value carries its own tone class
// and must stay independently styleable per row.
function SummaryRow({
  label,
  value,
  tone = "text-brown-800",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-brown-600">{label}</span>
      <span className={`font-figure shrink-0 text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

// Reuses the domain's `isOverrun` instead of re-testing the sign here, so "what
// counts as overrunning" keeps living in one place (see `spendRollup.ts`).
function deviationTone(row: LeafDeviation): string {
  if (row.deviation === 0) return "text-brown-500";
  return isOverrun(row) ? "text-red-600" : "text-green-700";
}

function DeviationRow({ row }: { row: LeafDeviation }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span data-testid="deviation-name" className="text-brown-800 min-w-0 truncate">
          {leafLabel(row)}
        </span>
        <span
          data-testid="deviation-amount"
          className={`font-figure shrink-0 text-sm font-bold ${deviationTone(row)}`}
        >
          {formatSigned(row.deviation)}
        </span>
      </div>
      <span className="font-figure text-2xs text-brown-400">
        {formatCLP(row.spent)} de {formatCLP(row.budgeted)}
      </span>
      {row.perWeek && (
        <span className="font-figure text-2xs text-brown-400">
          por semana: {formatCLP(row.perWeek.spentAvg)} de {formatCLP(row.perWeek.budgeted)} ·{" "}
          {row.perWeek.weeks} semanas
        </span>
      )}
    </div>
  );
}

// The list arrives worst overrun first, so the first few rows are the ones worth
// acting on; the rest stays one tap away instead of pushing the tab into a long
// scroll.
const COLLAPSED_DEVIATIONS = 3;

function DeviationList({ deviations }: { deviations: LeafDeviation[] }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = deviations.length - COLLAPSED_DEVIATIONS;
  const visible = expanded || hidden <= 0 ? deviations : deviations.slice(0, COLLAPSED_DEVIATIONS);

  return (
    <>
      {visible.map((row) => (
        <DeviationRow key={row.id} row={row} />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="bg-blush-300 text-blush-800 hover:bg-blush-500 cursor-pointer self-start rounded-full px-3 py-0.5 text-sm transition-colors"
        >
          {expanded ? "Ver menos" : `Ver más (${hidden})`}
        </button>
      )}
    </>
  );
}

// A leaf lands here because it overran THIS month, but `projectedOverrun` is
// signed: a weekly leaf that burst a 5-week month can fit inside a 4-week one
// with nothing to change. Asking to "recortar $-4.000" would be worse than
// saying nothing, so a non-positive projection states the good news instead.
function OverrunRow({ row }: { row: NextMonthOverrun }) {
  const needsCut = row.projectedOverrun > 0;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-800 min-w-0 truncate">{leafLabel(row)}</span>
        {needsCut ? (
          <span className="font-figure shrink-0 text-sm font-bold text-red-600">
            recortar {formatCLP(row.projectedOverrun)}
          </span>
        ) : (
          <span className="shrink-0 text-green-700">sin recorte necesario</span>
        )}
      </div>
      <span className="font-figure text-2xs text-brown-400">
        al ritmo actual: {formatCLP(row.projectedSpend)} de {formatCLP(row.budgeted)}
        {row.weeks !== null && ` · ${row.weeks} semanas`}
      </span>
    </div>
  );
}

// Read-only (v1 decision): every figure here comes from `computeMonthAnalysis`, and
// the deviation list is rendered in the order the domain ranked it — worst overrun
// first — never re-sorted locally.
export function AnalysisTab({ analysis }: Props) {
  if (!analysis) {
    return <p className="text-brown-500 text-sm">Cargando el análisis del mes…</p>;
  }

  const { summary, deviations, nextMonth } = analysis;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Resumen del mes" icon="📒" tone="sage">
        <SummaryRow label="Presupuestado" value={formatCLP(summary.budgeted)} />
        <SummaryRow label="Gastado" value={formatCLP(summary.spent)} />
        {/* "incluye" is doing real work here: this amount is already inside
            `Gastado`, so a bare "sin categoría: $X" left a reader unable to tell
            whether it still had to be added on top to get the true total. */}
        {summary.unassigned > 0 && (
          <span className="font-figure text-2xs text-brown-400 -mt-2 self-end">
            incluye sin categoría: {formatCLP(summary.unassigned)}
          </span>
        )}
        <div className="border-sage-300 border-t-2 border-dashed pt-3">
          <SummaryRow
            label="Diferencia"
            value={formatSigned(summary.difference)}
            tone={summary.difference < 0 ? "text-red-600" : "text-green-700"}
          />
        </div>
      </Section>

      {/* Next month comes before the deviations: it is the actionable block
          (what to cut), and the deviation list is the longer one. */}
      <Section title={`Próximo mes · ${formatMonth(nextMonth.month)}`} icon="🔮" tone="lilac">
        <SummaryRow label="Presupuesto proyectado" value={formatCLP(nextMonth.budgeted)} />
        <div className="border-lilac-300 flex flex-col gap-3 border-t-2 border-dashed pt-3">
          {nextMonth.overruns.length === 0 ? (
            <p className="text-brown-500 text-sm">Ninguna categoría se pasó del presupuesto</p>
          ) : (
            nextMonth.overruns.map((row) => <OverrunRow key={row.id} row={row} />)
          )}
        </div>
      </Section>

      <Section title="Desvíos por categoría" icon="🧭" tone="blush">
        {deviations.length === 0 ? (
          <p className="text-brown-500 text-sm">
            No hay categorías con presupuesto ni gasto en el mes
          </p>
        ) : (
          <DeviationList deviations={deviations} />
        )}
      </Section>
    </div>
  );
}
