import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const title = process.env.NEXT_PUBLIC_APP_NAME ?? "Đóng Ấn KT";

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: `🎮 ${title}\n\nGame hôm nay đã mở! Bấm nút bên dưới để chơi (5 câu).`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Mở Mini App ✅",
            web_app: { url: appUrl },
          },
        ],
      ],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json({ ok: false, error: t }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
