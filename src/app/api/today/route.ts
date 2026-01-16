import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vnDateISO } from "@/lib/timeVN";

export async function GET() {
  const day = vnDateISO();
  const qs = await prisma.question.findMany({
    where: { day },
    orderBy: { order: "asc" },
    take: 5,
  });

  return NextResponse.json({
    day,
    questions: qs.map((q) => ({
      id: q.id,
      order: q.order,
      prompt: q.prompt,
      blanks: JSON.parse(q.answers).length,
    })),
  });
}
