import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** YYYY-MM-DD theo múi giờ VN */
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

  // Tạo 5 question và lấy id
  const createdIds: string[] = [];
  for (const s of samples) {
    const q = await prisma.question.create({
      data: {
        prompt: s.prompt,
        answers: s.answers, // Prisma Json: truyền thẳng mảng
        isActive: true,
      },
      select: { id: true },
    });
    createdIds.push(q.id);
  }

  const finishMessage = "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄";

  // Upsert DailySet theo dayKey
  const seed = Math.floor(Math.random() * 1_000_000_000);

  await prisma.dailySet.upsert({
    where: { dayKey },
    update: {
      seed,
      payload: {
        questionIds: createdIds,
        finishMessage,
      },
    },
    create: {
      dayKey,
      seed,
      payload: {
        questionIds: createdIds,
        finishMessage,
      },
    },
  });

  console.log("Seed OK:", { dayKey, questions: createdIds.length, seed });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
