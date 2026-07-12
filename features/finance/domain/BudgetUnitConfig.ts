export type UnitConfig = {
  unitAmount: number; // manual
  quantity: number; // manual, default 1  (e.g. "5 Tuesdays this month")
  factor: number; // manual, default 1  (90% => 0.9)
};

export type BudgetUnitConfig = Record<string /* category */, UnitConfig>;

/** Single source of truth for the derived flat total. CLP has no cents, so we round to an
 *  integer to avoid float drift (e.g. 55000 * 5 * 0.9 = 247500 exactly, but factors like 1/3
 *  would otherwise leak binary-float noise into the stored total). */
export function deriveUnitTotal(cfg: UnitConfig): number {
  return Math.round(cfg.unitAmount * cfg.quantity * cfg.factor);
}

export const DEFAULT_UNIT_CONFIG: Omit<UnitConfig, "unitAmount"> = { quantity: 1, factor: 1 };
