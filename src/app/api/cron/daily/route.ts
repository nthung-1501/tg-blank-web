import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * dayKey theo múi giờ VN dạng YYYY-MM-DD
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const title = process.env.NEXT_PUBLIC_APP_NAME ?? "Đóng Ấn KT";

    const dayKey = vnDayKey();

    // 1) đảm bảo hôm nay có DailySet
    const existing = await prisma.dailySet.findUnique({
      where: { dayKey },
      select: { dayKey: true },
    });

    if (!existing) {
      // Lấy 5 câu hỏi active bất kỳ; nếu chưa có đủ thì tạo mẫu
      let questions = await prisma.question.findMany({
        where: { isActive: true },
        select: { id: true },
        take: 5,
      });

      if (questions.length < 5) {
        const samples = [
          { prompt: "Hôm nay trời {{1}} và tôi uống {{2}}.", answers: ["đẹp", "sữa"] },
          { prompt: "Nhóm mình tên là {{1}}, mục tiêu tuần này là {{2}}.", answers: ["KT", "vui"] },
          { prompt: "Tôi {{1}} lúc {{2}} giờ sáng.", answers: ["dậy", "8"] },
          { prompt: "Con bò sữa đang {{1}} trên {{2}} xanh.", answers: ["nhảy", "đồng cỏ"] },
          { prompt: "Đóng Ấn KT: {{1}} là sức mạnh, {{2}} là chiến thắng!", answers: ["đoàn kết", "kiên trì"] },
        ];

        for (const s of samples) {
          await prisma.question.create({
            data: { prompt: s.prompt, answers: s.answers as any, isActive: true },
          });
        }

        questions = await prisma.question.findMany({
          where: { isActive: true },
          select: { id: true },
          take: 5,
        });
      }

      const questionIds = questions.map((q) => q.id);

      await prisma.dailySet.create({
        data: {
          id: crypto.randomUUID(),
          dayKey,
          seed: Math.floor(Math.random() * 1_000_000),
          payload: {
            questionIds,
            finishMessage: "Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄",
          },
        },
      });
    }

    // 2) gửi Telegram
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const tgPayload = {
      chat_id: chatId,
      text: `🎮 ${title}\n\nGame hôm nay đã mở! Bấm nút bên dưới để chơi (5 câu).`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Mở Mini App ✅",
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tgPayload),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ ok: false, error: t }, { status: 500 });
    }

    return NextResponse.json({ ok: true, dayKey, seeded: !existing });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "cron daily failed" },
      { status: 500 }
    );
  }
}
