// src/app/api/today/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function GET() {
  try {
    const now = new Date();
    const s = startOfDay(now);
    const e = endOfDay(now);

    // DailySet.date là DateTime @id → ta tìm record trong khoảng ngày
    const daily = await prisma.dailySet.findFirst({
      where: { date: { gte: s, lte: e } },
    });

    if (!daily) {
      return NextResponse.json(
        { ok: false, error: "No daily set for today" },
        { status: 404 }
      );
    }

    const ids = (daily.questionIds as unknown as string[]) || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "DailySet.questionIds is empty" },
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
      date: s.toISOString().slice(0, 10),
      finishMessage: daily.finishMessage || "",
      questions: ordered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "today failed" },
      { status: 500 }
    );
  }
}
