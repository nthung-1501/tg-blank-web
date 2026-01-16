import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const now = new Date();
    const start = startOfDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // 1) Lấy DailySet của hôm nay (date nằm trong [start, end))
    const daily = await prisma.dailySet.findFirst({
      where: { date: { gte: start, lt: end } },
    });

    if (!daily) {
      return NextResponse.json(
        { ok: false, error: "Chưa có bộ câu hỏi hôm nay (DailySet)" },
        { status: 404 }
      );
    }

    // 2) Parse questionIds (Json) -> string[]
    const idsRaw = daily.questionIds as unknown;
    const ids =
      Array.isArray(idsRaw) ? idsRaw.filter((x) => typeof x === "string") : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "DailySet.questionIds rỗng/không đúng định dạng" },
        { status: 500 }
      );
    }

    // 3) Lấy questions theo id
    const qs = await prisma.question.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, prompt: true, answers: true },
    });

    // 4) Sắp theo đúng thứ tự ids
    const map = new Map(qs.map((q) => [q.id, q]));
    const questions = ids.map((id) => map.get(id)).filter(Boolean);

    return NextResponse.json({
      ok: true,
      date: daily.date,
      finishMessage: daily.finishMessage,
      questions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "today api failed" },
      { status: 500 }
    );
  }
}
