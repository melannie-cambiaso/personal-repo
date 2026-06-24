import "server-only";
import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return _client;
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`,
    to: `whatsapp:${to}`,
    body,
  });
}
