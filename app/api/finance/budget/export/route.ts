import "server-only";
import ExcelJS from "exceljs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  loadBudget,
  loadCategories,
  loadClosedCategories,
  loadExcludedCategories,
  loadTransactions,
} from "@/features/finance/data/kvAdapter";
import { buildBudgetExportRows } from "@/features/finance/domain";

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-\d{2}$/;
const CLP_NUM_FMT = '"$" #,##0';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const isOwner = !!cookieStore.get("wishlist_auth")?.value;
  if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month || !MONTH_RE.test(month)) {
    return NextResponse.json({ error: "Missing or invalid month" }, { status: 400 });
  }

  const [budget, transactions, groups, closedCategories, excludedCategories] = await Promise.all([
    loadBudget(month),
    loadTransactions(month),
    loadCategories(),
    loadClosedCategories(month),
    loadExcludedCategories(month),
  ]);

  const rows = buildBudgetExportRows(
    groups,
    budget,
    transactions,
    closedCategories,
    excludedCategories
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Presupuesto");

  sheet.columns = [
    { header: "Categoría", key: "categoria", width: 28 },
    { header: "Presupuestado", key: "presupuestado", width: 16 },
    { header: "Real", key: "real", width: 16 },
    { header: "Diferencia", key: "diferencia", width: 16 },
    { header: "Cerrada", key: "cerrada", width: 10 },
  ];

  for (const row of rows) {
    sheet.addRow({
      categoria: row.categoria,
      presupuestado: row.presupuestado,
      real: row.real,
      diferencia: row.diferencia,
      cerrada: row.cerrada ? "Sí" : "No",
    });
  }

  sheet.getColumn("presupuestado").numFmt = CLP_NUM_FMT;
  sheet.getColumn("real").numFmt = CLP_NUM_FMT;
  sheet.getColumn("diferencia").numFmt = CLP_NUM_FMT;

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="presupuesto-${month}.xlsx"`,
    },
  });
}
