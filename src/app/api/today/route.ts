// src/app/api/today/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** dayKey theo VN: YYYY-MM-DD */
function vnDayKey(d = new Date()) {
  const vn = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const dayKey = vnDayKey();

    // schema mới: DailySet có unique dayKey
    const daily = await prisma.dailySet.findUnique({
      where: { dayKey },
      select: { dayKey: true, payload: true },
    });

    if (!daily) {
      return NextResponse.json(
        { ok: false, error: "No daily set for today", dayKey },
        { status: 404 }
      );
    }

    const payload = (daily.payload ?? {}) as any;
    const ids = (payload.questionIds ?? []) as string[];
    const finishMessage = String(payload.finishMessage ?? "");

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "DailySet payload.questionIds is empty", dayKey },
        { status: 500 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, prompt: true, answers: true },
    });

    // sort theo đúng thứ tự ids
    const map = new Map(questions.map((q) => [q.id, q]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean);

    return NextResponse.json({
      ok: true,
      dayKey,
      finishMessage,
      questions: ordered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "today failed" },
      { status: 500 }
    );
  }
}
