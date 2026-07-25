export interface FinanceV2Config {
  income: number; // CLP, >= 0
  fixedPct: number; // 0..100 integer
  variablePct: number;
  savingsPct: number;
}

export const DEFAULT_FINANCE_V2_CONFIG: FinanceV2Config = {
  income: 0,
  fixedPct: 50,
  variablePct: 30,
  savingsPct: 20,
};
