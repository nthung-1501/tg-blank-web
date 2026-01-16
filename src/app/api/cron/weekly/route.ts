// src/app/api/cron/weekly/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
function assertCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return; // nếu bạn chưa dùng secret thì cho qua
  const got =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (got !== secret) {
    throw new Error("Unauthorized");
  }
}

export async function GET(req: Request) {
  try {
    assertCron(req);

    // Lấy 7 ngày gần nhất (tính theo server time)
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    // ✅ Đúng schema: DailyScore có (userId, date, score)
    const rows = await prisma.dailyScore.findMany({
      where: { date: { gte: start, lte: end } },
      select: {
        userId: true,
        score: true,
        user: { select: { telegramId: true, name: true, username: true } },
      },
    });

    // Gom điểm theo user
    const map = new Map<
      string,
      { telegramId: string; name: string; username?: string | null; total: number }
    >();

    for (const r of rows) {
      const key = r.userId;
      const cur = map.get(key);
      const tgId = r.user.telegramId.toString(); // BigInt -> string
      const name = r.user.name || (r.user.username ? `@${r.user.username}` : tgId);

      if (!cur) {
        map.set(key, { telegramId: tgId, name, username: r.user.username, total: r.score });
      } else {
        cur.total += r.score;
      }
    }

    const leaderboard = [...map.values()].sort((a, b) => b.total - a.total);

    return NextResponse.json({
      ok: true,
      range: { start: start.toISOString(), end: end.toISOString() },
      leaderboard,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Weekly cron failed" },
      { status: 500 }
    );
  }
}
