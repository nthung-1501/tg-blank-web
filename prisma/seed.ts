import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** dayKey theo VN: YYYY-MM-DD */
function vnDayKey(d = new Date()) {
  const vn = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  const dayKey = vnDayKey();

  const samples = [
    { prompt: "Hôm nay trời {{1}} và tôi uống {{2}}.", answers: ["đẹp", "sữa"] },
    { prompt: "Nhóm mình tên là {{1}}, mục tiêu tuần này là {{2}}.", answers: ["KT", "vui"] },
    { prompt: "Tôi {{1}} lúc {{2}} giờ sáng.", answers: ["dậy", "8"] },
    { prompt: "Con bò sữa đang {{1}} trên {{2}} xanh.", answers: ["nhảy", "đồng cỏ"] },
    { prompt: "Đóng Ấn KT: {{1}} là sức mạnh, {{2}} là chiến thắng!", answers: ["đoàn kết", "kiên trì"] },
  ];

  // tạo questions (nếu bạn muốn nhập tay trong DB thì có thể bỏ khúc này)
  const ids: string[] = [];
  for (const s of samples) {
    const q = await prisma.question.create({
      data: { prompt: s.prompt, answers: s.answers as any, isActive: true },
      select: { id: true },
    });
    ids.push(q.id);
  }

  const finishMessage = "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄";

  // DailySet schema mới: dayKey + payload (Json) + seed
  await prisma.dailySet.upsert({
    where: { dayKey },
    update: {
      payload: { questionIds: ids, finishMessage },
      seed: "seed.ts",
    },
    create: {
      dayKey,
      payload: { questionIds: ids, finishMessage },
      seed: "seed.ts",
    },
  });

  console.log("Seed OK:", { dayKey, questions: ids.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
