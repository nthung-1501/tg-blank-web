import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const tgName = String(body.tgName ?? "Người chơi");
  const score = String(body.score ?? "0");

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const photoUrl = `${appUrl}/api/og/daily?name=${encodeURIComponent(
    tgName
  )}&score=${encodeURIComponent(score)}`;

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: `🎮 Đóng Ấn KT\n👤 ${tgName}\n✅ Điểm hôm nay: ${score}/5`,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json({ ok: false, error: t }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
