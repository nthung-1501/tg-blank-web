import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Trả về dayKey theo múi giờ VN dạng "YYYY-MM-DD"
 */
function vnDayKey() {
  const now = new Date();
  const vn = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
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

  // Tạo questions và lấy id
  const createdIds: string[] = [];
  for (const s of samples) {
    const q = await prisma.question.create({
      data: {
        prompt: s.prompt,
        answers: s.answers as any, // nếu schema answers là Json
        isActive: true,
      },
      select: { id: true },
    });
    createdIds.push(q.id);
  }

  const finishMessage = "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄";

  // Lưu DailySet theo schema mới: { id, dayKey, seed, payload, createdAt, updatedAt }
  // payload sẽ chứa những thứ trước đây bạn để ở questionIds + finishMessage
  const seed = Math.floor(Math.random() * 1_000_000);

  await prisma.dailySet.upsert({
    where: { dayKey }, // dayKey là unique
    update: {
      seed,
      payload: { questionIds: createdIds, finishMessage },
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      dayKey,
      seed,
      payload: { questionIds: createdIds, finishMessage },
    },
  });

  console.log("Seed OK:", {
    dayKey,
    questions: createdIds.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
