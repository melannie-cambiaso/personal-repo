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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <h3 className="text-2xs tracking-badge text-brown-500 font-bold uppercase">{title}</h3>
      {children}
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
      <span className="text-brown-500 text-sm">{label}</span>
      <span className={`text-sm font-bold ${tone}`}>{value}</span>
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
        <span data-testid="deviation-name" className="text-brown-800 min-w-0 truncate text-sm">
          {leafLabel(row)}
        </span>
        <span
          data-testid="deviation-amount"
          className={`shrink-0 text-sm font-bold ${deviationTone(row)}`}
        >
          {formatSigned(row.deviation)}
        </span>
      </div>
      <span className="text-2xs text-brown-400">
        {formatCLP(row.spent)} de {formatCLP(row.budgeted)}
      </span>
      {row.perWeek && (
        <span className="text-2xs text-brown-400">
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
          className="text-2xs text-brown-400 hover:text-brown-800 cursor-pointer self-start font-semibold transition-colors"
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
        <span className="text-brown-800 min-w-0 truncate text-sm">{leafLabel(row)}</span>
        {needsCut ? (
          <span className="shrink-0 text-sm font-bold text-red-600">
            recortar {formatCLP(row.projectedOverrun)}
          </span>
        ) : (
          <span className="shrink-0 text-sm font-bold text-green-700">sin recorte necesario</span>
        )}
      </div>
      <span className="text-2xs text-brown-400">
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
      <Section title="Resumen del mes">
        <SummaryRow label="Presupuestado" value={formatCLP(summary.budgeted)} />
        <SummaryRow label="Gastado" value={formatCLP(summary.spent)} />
        {/* "incluye" is doing real work here: this amount is already inside
            `Gastado`, so a bare "sin categoría: $X" left a reader unable to tell
            whether it still had to be added on top to get the true total. */}
        {summary.unassigned > 0 && (
          <span className="text-2xs text-brown-400 -mt-2 self-end">
            incluye sin categoría: {formatCLP(summary.unassigned)}
          </span>
        )}
        <div className="border-cream-300 border-t pt-3">
          <SummaryRow
            label="Diferencia"
            value={formatSigned(summary.difference)}
            tone={summary.difference < 0 ? "text-red-600" : "text-green-700"}
          />
        </div>
      </Section>

      {/* Next month comes before the deviations: it is the actionable block
          (what to cut), and the deviation list is the longer one. */}
      <Section title={`Próximo mes · ${formatMonth(nextMonth.month)}`}>
        <SummaryRow label="Presupuesto proyectado" value={formatCLP(nextMonth.budgeted)} />
        <div className="border-cream-300 flex flex-col gap-3 border-t pt-3">
          {nextMonth.overruns.length === 0 ? (
            <p className="text-brown-500 text-sm">Ninguna categoría se pasó del presupuesto</p>
          ) : (
            nextMonth.overruns.map((row) => <OverrunRow key={row.id} row={row} />)
          )}
        </div>
      </Section>

      <Section title="Desvíos por categoría">
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
