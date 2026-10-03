export { clampAmount } from "./clamp";
export type { BucketKey } from "./BucketKey";
export type {
  BudgetSubcategory,
  BudgetCategory,
  BudgetConfig,
  BudgetFrequency,
} from "./BudgetConfig";
export { DEFAULT_BUDGET_CONFIG } from "./BudgetConfig";
// Part of the budget leaf shape (`BudgetCategory.weekday`), re-exported so
// presentation code types weekdays through the domain barrel.
export type { Weekday } from "@/shared/utils/monthUtils";
export type { BudgetLeafAmount } from "./budgetAmount";
export { resolveLeafMonthlyAmount } from "./budgetAmount";
export type { CategoryView } from "./categoryView";
export { toCategoryView } from "./categoryView";
export type { BucketTotals, BudgetComparison } from "./budgetRollup";
export { computeBucketTotals, computeBudgetComparison } from "./budgetRollup";
export type { SpendRow, BucketSpendRow, SpendComparison } from "./spendRollup";
export { computeSpentByCategory, computeSpendComparison, isOverrun } from "./spendRollup";
export type {
  MonthAnalysis,
  MonthAnalysisSummary,
  LeafDeviation,
  LeafPerWeek,
  NextMonthProjection,
  NextMonthOverrun,
} from "./monthAnalysis";
export { computeMonthAnalysis } from "./monthAnalysis";
export {
  addCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  setLeafAmount,
  setLeafFrequency,
  setLeafWeekday,
} from "./budgetMutations";
export type {
  ExpenseBucketKey,
  TransactionCategoryRef,
  TransactionSourceCategoryRef,
  FinanceV2Transaction,
} from "./FinanceV2Transaction";
export { isTransactionMonth, toLocalISODate } from "./transactionDate";
export { addTransaction, deleteTransaction } from "./transactionMutations";
export type { TransactionTotals } from "./transactionTotals";
export { computeTransactionTotals } from "./transactionTotals";
export type { EnvelopeConfig } from "./EnvelopeConfig";
export type { EnvelopeFlows } from "./envelope";
export { computeEnvelopeFlows, monthsFromTo, resolvePaidFrom, suggestedTransfer } from "./envelope";
export { computePendingFromMain } from "./pendingFromMain";
export type { DayGroup } from "./groupTransactionsByDay";
export { groupTransactionsByDay } from "./groupTransactionsByDay";
export type { ExpenseCategoryOption } from "./expenseCategoryOptions";
export { listExpenseCategoryOptions } from "./expenseCategoryOptions";
