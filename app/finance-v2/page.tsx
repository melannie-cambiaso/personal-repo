import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  loadBudgetVersions,
  handleSaveBudgetVersion,
  loadTransactions,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
  loadEnvelopeConfig,
  loadEnvelopeCarriedBalance,
  handleSaveEnvelopeConfig,
  handleLoadEnvelopeCarriedBalance,
} from "@/features/finance-v2/data";
import { FinanceV2Screen } from "@/features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen";
import { currentMonth } from "@/shared/utils/monthUtils";

export default async function FinanceV2Page() {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) redirect("/login");

  const month = currentMonth();

  const [initialBudgetVersions, initialTransactions, initialEnvelopeConfig] = await Promise.all([
    loadBudgetVersions(),
    loadTransactions(month),
    loadEnvelopeConfig(),
  ]);
  // Sequential on purpose: it needs the config's opening month/balance. Loaded here so the
  // envelope's first render needs no client fetch.
  const initialCarriedIn = await loadEnvelopeCarriedBalance(initialEnvelopeConfig, month);

  return (
    <FinanceV2Screen
      initialBudgetVersions={initialBudgetVersions}
      onSaveBudget={handleSaveBudgetVersion}
      initialTransactions={initialTransactions}
      initialMonth={month}
      onSaveTransactions={handleSaveTransactions}
      onSaveToOtherMonth={handleAppendTransactionToMonth}
      onLoadTransactions={handleLoadTransactions}
      initialEnvelopeConfig={initialEnvelopeConfig}
      initialCarriedIn={initialCarriedIn}
      onSaveEnvelopeConfig={handleSaveEnvelopeConfig}
      onLoadEnvelopeCarriedBalance={handleLoadEnvelopeCarriedBalance}
    />
  );
}
