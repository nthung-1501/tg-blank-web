import { prisma } from "../src/lib/prisma";
import { vnDateISO } from "../src/lib/timeVN";

async function main() {
  const day = vnDateISO();

  // đoạn hoàn thành (admin sửa trong DB = Setting)
  await prisma.setting.upsert({
    where: { key: "completion_text" },
    update: {},
    create: {
      key: "completion_text",
      value: "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄",
    },
  });

  // 5 câu mẫu dạng nhiều chỗ trống: {{1}}, {{2}}, ...
  const samples = [
    {
      order: 1,
      prompt: "Hôm nay trời {{1}} và tôi uống {{2}}.",
      answers: ["đẹp", "sữa"],
    },
    {
      order: 2,
      prompt: "Nhóm mình tên là {{1}}, mục tiêu tuần này là {{2}}.",
      answers: ["KT", "vui"],
    },
    {
      order: 3,
      prompt: "Tôi {{1}} lúc {{2}} giờ sáng.",
      answers: ["dậy", "8"],
    },
    {
      order: 4,
      prompt: "Con bò sữa đang {{1}} trên {{2}} xanh.",
      answers: ["nhảy", "đồng cỏ"],
    },
    {
      order: 5,
      prompt: "Đóng Ấn KT: {{1}} là sức mạnh, {{2}} là chiến thắng!",
      answers: ["đoàn kết", "kiên trì"],
    },
  ];

  for (const s of samples) {
    await prisma.question.upsert({
      where: { day_order: { day, order: s.order } },
      update: { prompt: s.prompt, answers: JSON.stringify(s.answers) },
      create: { day, order: s.order, prompt: s.prompt, answers: JSON.stringify(s.answers) },
    });
  }

  console.log("Seed OK for day:", day);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
