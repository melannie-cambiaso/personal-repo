import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { loadTodoItems } from "@/features/todo/data/todoItems";
import { sendDiscordMessage } from "@/shared/discord";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await loadTodoItems();
  const pending = items.filter((item) => !item.completed);

  if (pending.length === 0) {
    return NextResponse.json({ sent: false, reason: "no pending items" }, { status: 200 });
  }

  const bullets = pending.map((i) => `• ${i.title}`).join("\n");
  const message = `🗒️ Recordatorio diario — Pendientes\n${bullets}\n\n(${pending.length} tareas pendientes)`;

  try {
    await sendDiscordMessage(message);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ sent: true, itemCount: pending.length });
}
