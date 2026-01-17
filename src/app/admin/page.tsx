export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { upsertDailySetAction } from "./actions";

function vnDayKey(d = new Date()) {
  const vn = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, "0");
  const dd = String(vn.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AdminDailyPage({
  searchParams,
}: {
  searchParams: { secret?: string };
}) {
  const secret = searchParams?.secret || "";

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h2>401 - Unauthorized</h2>
        <p>Mở theo dạng: <code>/admin/daily?secret=ADMIN_SECRET</code></p>
      </div>
    );
  }

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, prompt: true },
    take: 200,
  });

  const todayKey = vnDayKey();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <h1>Admin: Tạo DailySet</h1>
      <p>
        Chọn <b>đúng 5 câu</b> (theo thứ tự bạn đặt). Sau khi lưu, game sẽ lấy theo{" "}
        <code>DailySet.payload.questionIds</code>.
      </p>

      <form action={upsertDailySetAction} style={{ marginTop: 16 }}>
        <input type="hidden" name="secret" value={secret} />

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label>
            <div>dayKey (VN)</div>
            <input
              name="dayKey"
              defaultValue={todayKey}
              style={{ width: "100%", padding: 8 }}
              placeholder="YYYY-MM-DD"
            />
          </label>

          <label>
            <div>seed (tuỳ chọn)</div>
            <input
              name="seed"
              defaultValue="0"
              style={{ width: "100%", padding: 8 }}
              placeholder="0"
            />
          </label>

          <label>
            <div>finishMessage</div>
            <input
              name="finishMessage"
              defaultValue="Hôm nay bạn đã đóng ấn thành công! Mai quay lại nhé 😄"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <hr style={{ margin: "18px 0" }} />

        <div style={{ display: "grid", gap: 10 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "24px 72px 1fr",
                gap: 10,
                alignItems: "center",
              }}
            >
              {/* Checkbox -> nếu check, ta dùng input order để quyết định thứ tự */}
              <input type="checkbox" id={`cb-${q.id}`} />

              {/* Order: người dùng điền 1..5 cho các câu đã chọn.
                  Ta submit bằng name="q:<id>" để server action đọc được.
                  Mẹo: bạn chỉ cần nhập 1..5 cho 5 câu muốn dùng, còn lại để trống.
              */}
              <input
                name={`q:${q.id}`}
                placeholder="Thứ tự"
                style={{ padding: 8 }}
                defaultValue=""
              />

              <label htmlFor={`cb-${q.id}`} style={{ cursor: "pointer" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{q.id}</div>
                <div style={{ fontSize: 16 }}>{q.prompt}</div>
              </label>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            Lưu DailySet
          </button>

          <span style={{ opacity: 0.75 }}>
            Cách dùng: chỉ cần nhập <b>1..5</b> vào ô “Thứ tự” của 5 câu bạn muốn chọn.
          </span>
        </div>
      </form>
    </div>
  );
}
