import "server-only";

export async function sendDiscordMessage(content: string): Promise<void> {
  const res = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Discord webhook failed: ${res.status}`);
}
