import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { loadTodoItems } from "@/features/todo/data/todoItems";
import { sendWhatsApp } from "@/shared/twilio";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await loadTodoItems();
  const pending = items.filter((item) => !item.completed);

  if (pending.length === 0) {
    return NextResponse.json(
      { sent: false, reason: "no pending items" },
      { status: 200 }
    );
  }

  const bullets = pending.map((i) => `• ${i.title}`).join("\n");
  const message = `🗒️ Recordatorio diario — Pendientes\n${bullets}\n\n(${pending.length} tareas pendientes)`;

  const recipients = [
    process.env.WHATSAPP_PHONE_PEDRO!,
    process.env.WHATSAPP_PHONE_MEME!,
  ];

  try {
    await Promise.all(recipients.map((to) => sendWhatsApp(to, message)));
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    sent: true,
    recipients: recipients.length,
    itemCount: pending.length,
  });
}
