// src/app/api/submit/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const telegramIdRaw = body.telegramId; // number|string
    const name = (body.name || "Người chơi") as string;
    const username = (body.username || null) as string | null;

    const questionId = body.questionId as string;
    const answer = (body.answer || "") as string;

    if (!telegramIdRaw || !questionId) {
      return NextResponse.json(
        { ok: false, error: "missing telegramId/questionId" },
        { status: 400 }
      );
    }

    const telegramId = BigInt(telegramIdRaw);

    const q = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, answers: true },
    });

    if (!q) {
      return NextResponse.json({ ok: false, error: "question not found" }, { status: 404 });
    }

    // answers: Json -> bạn tự quy ước, ví dụ: ["A","B"] hoặc {"correct":"A"}
    let isCorrect = false;
    const a: any = q.answers;

    if (Array.isArray(a)) {
      isCorrect = a.map(String).includes(String(answer));
    } else if (a && typeof a === "object" && "correct" in a) {
      isCorrect = String(a.correct) === String(answer);
    }

    const today = startOfDay(new Date());

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { name, username },
      create: { telegramId, name, username },
      select: { id: true },
    });

    await prisma.submission.create({
      data: {
        userId: user.id,
        date: today,
        questionId,
        answer,
        isCorrect,
      },
    });

    await prisma.dailyScore.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { score: { increment: isCorrect ? 1 : 0 } },
      create: {
        userId: user.id,
        date: today,
        score: isCorrect ? 1 : 0,
      },
    });

    return NextResponse.json({ ok: true, isCorrect });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "submit failed" },
      { status: 500 }
    );
  }
}
