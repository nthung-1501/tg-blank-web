import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lấy ngày hiện tại theo múi giờ VN và trả về DateTime 00:00:00 +07:00
 * DailySet.date là @id DateTime nên dùng Date.
 */
function vnStartOfDayDate() {
  const now = new Date();
  const vn = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000+07:00`);
}

async function main() {
  const date = vnStartOfDayDate();

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
        answers: s.answers, // Json => truyền thẳng mảng
        isActive: true,
      },
      select: { id: true },
    });
    createdIds.push(q.id);
  }

  // Upsert DailySet cho ngày hôm nay
  await prisma.dailySet.upsert({
    where: { date },
    update: {
      questionIds: createdIds, // Json => truyền thẳng mảng id
      finishMessage: "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄",
    },
    create: {
      date,
      questionIds: createdIds,
      finishMessage: "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄",
    },
  });

  console.log("Seed OK:", {
    date: date.toISOString(),
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
