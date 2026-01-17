"use server";

import { prisma } from "@/lib/prisma";

function vnDayKey(d = new Date()) {
  const vn = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
}

export async function upsertDailySetAction(formData: FormData) {
  const secret = String(formData.get("secret") || "");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return { ok: false, error: "Unauthorized" };
  }

  const dayKey = (String(formData.get("dayKey") || "") || vnDayKey()).trim();
  const finishMessage = String(formData.get("finishMessage") || "").trim();
  const seed = Number(formData.get("seed") || 0) || 0;

  // Lấy list "q:<id>" theo đúng thứ tự người dùng kéo/thả (ta dùng order input)
  const picked: Array<{ id: string; order: number }> = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("q:")) continue;
    const id = k.slice(2);
    const order = Number(v) || 0;
    picked.push({ id, order });
  }

  // sort theo order
  picked.sort((a, b) => a.order - b.order);

  const questionIds = picked.map((x) => x.id);

  if (questionIds.length !== 5) {
    return { ok: false, error: `Bạn phải chọn đúng 5 câu (hiện tại: ${questionIds.length}).` };
  }

  // Validate: các question phải tồn tại + isActive = true
  const found = await prisma.question.findMany({
    where: { id: { in: questionIds }, isActive: true },
    select: { id: true },
  });
  if (found.length !== 5) {
    return { ok: false, error: "Có câu hỏi không tồn tại hoặc đang isActive=false." };
  }

  // Upsert DailySet theo dayKey
  await prisma.dailySet.upsert({
    where: { dayKey },
    update: {
      seed,
      payload: { questionIds },
      finishMessage,
      updatedAt: new Date(),
    },
    create: {
      dayKey,
      seed,
      payload: { questionIds },
      finishMessage,
    },
  });

  return { ok: true, dayKey, questionIds };
}
