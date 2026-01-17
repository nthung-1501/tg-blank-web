// src/app/api/admin/daily/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// YYYY-MM-DD theo VN
function vnDayKey(d = new Date()) {
  const vn = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dayKey = searchParams.get("dayKey") || vnDayKey();

  // Lấy 5 câu active bất kỳ (hoặc bạn tự set tay trong DB)
  const qs = await prisma.question.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  if (qs.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Not enough active questions (need >= 5)" },
      { status: 400 }
    );
  }

  const ids = qs.map((q) => q.id);
  const seed = Math.floor(Math.random() * 1_000_000_000);

  const daily = await prisma.dailySet.upsert({
    where: { dayKey },
    update: {
      seed,
      payload: { questionIds: ids },
    },
    create: {
      dayKey,
      seed,
      payload: { questionIds: ids },
    },
  });

  return NextResponse.json({ ok: true, dayKey, daily });
}
