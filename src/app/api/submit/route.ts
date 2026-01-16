import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vnDateISO } from "@/lib/timeVN";
export const runtime = "nodejs";
function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const body = await req.json();
  const tgUserId = BigInt(body.tgUserId ?? 0);
  const tgName = String(body.tgName ?? "Người chơi");
  const day = String(body.day ?? vnDateISO());
  const answers: Array<{ questionId: string; values: string[] }> = body.answers ?? [];

  const qids = answers.map((a) => a.questionId);
  const qs = await prisma.question.findMany({ where: { id: { in: qids }, day } });

  const byId = new Map(qs.map((q) => [q.id, q]));

  let score = 0;

  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;

    const correct: string[] = JSON.parse(q.answers);
    const userVals = (a.values ?? []).map(norm);

    const ok =
      correct.length === userVals.length &&
      correct.every((c, i) => norm(c) === userVals[i]);

    if (ok) score += 1; // +1 mỗi câu (đúng hết blanks)
  }

  const payload = { answers };

  await prisma.submission.upsert({
    where: { day_tgUserId: { day, tgUserId } },
    update: { score, payload: JSON.stringify(payload), tgName },
    create: { day, tgUserId, tgName, score, payload: JSON.stringify(payload) },
  });

  return NextResponse.json({ score });
}
