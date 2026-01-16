import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vnWeekRange } from "@/lib/weekVN";

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

  const { start, end } = vnWeekRange(new Date());

  // Lấy submissions trong tuần (Mon..Sun) theo YYYY-MM-DD string
  const rows = await prisma.submission.findMany({
    where: {
      day: { gte: start, lte: end },
    },
    select: { tgUserId: true, tgName: true, score: true },
  });

  // Sum theo user
  const map = new Map<string, { name: string; total: number }>();
  for (const r of rows) {
    const id = r.tgUserId.toString();
    const cur = map.get(id) ?? { name: r.tgName, total: 0 };
    cur.name = r.tgName || cur.name;
    cur.total += r.score;
    map.set(id, cur);
  }

  const list = Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .filter((x) => x.total > 0);

  if (list.length === 0) {
    // Không có dữ liệu tuần -> vẫn post thông báo nhẹ
    const sendMsg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `📊 ${title}\nTổng kết tuần (${start} → ${end})\n\nChưa có dữ liệu điểm tuần này.`,
      }),
    });

    if (!sendMsg.ok) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, empty: true });
  }

  // Lấy top 8, gom phần còn lại vào "Khác" để URL không quá dài
  const top = list[0];
  const topN = list.slice(0, 8);
  const rest = list.slice(8);
  const otherTotal = rest.reduce((a, b) => a + b.total, 0);

  const names = [...topN.map((x) => x.name), ...(otherTotal > 0 ? ["Khác"] : [])];
  const values = [...topN.map((x) => x.total), ...(otherTotal > 0 ? [otherTotal] : [])];

  const qpNames = names.map((n) => encodeURIComponent(n)).join("|");
  const qpValues = values.map((v) => encodeURIComponent(String(v))).join("|");
  const qpTop = encodeURIComponent(top.name);
  const weekLabel = `${start}→${end}`;

  const photoUrl =
    `${appUrl}/api/og/weekly?title=${encodeURIComponent(title)}` +
    `&week=${encodeURIComponent(weekLabel)}` +
    `&names=${qpNames}` +
    `&values=${qpValues}` +
    `&top=${qpTop}`;

  // Caption + hiệu ứng top1
  const lines = topN.map((x, idx) => `${idx === 0 ? "👑" : "•"} ${x.name}: ${x.total}`).join("\n");

  const caption =
    `📊 ${title}\nTổng kết tuần (${start} → ${end})\n\n` +
    `✨ TOP 1: ${top.name} — ${top.total} điểm ✨\n\n` +
    `${lines}\n\n` +
    `Chúc mừng quán quân! 👑🔥`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json({ ok: false, error: t }, { status: 500 });
  }

  return NextResponse.json({ ok: true, start, end, top: top.name });
}
