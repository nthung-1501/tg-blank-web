"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Q = { id: string; order: number; prompt: string; blanks: number };

function splitPrompt(prompt: string, blanks: number) {
  // tách theo {{1}}, {{2}} ... để render input vào đúng vị trí
  const parts: string[] = [];
  let cursor = 0;
  for (let i = 1; i <= blanks; i++) {
    const token = `{{${i}}}`;
    const idx = prompt.indexOf(token, cursor);
    if (idx === -1) break;
    parts.push(prompt.slice(cursor, idx));
    parts.push(token);
    cursor = idx + token.length;
  }
  parts.push(prompt.slice(cursor));
  return parts;
}

export default function GamePage() {
  const router = useRouter();

  const [day, setDay] = useState("");
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [values, setValues] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  // tạm: lấy tên/id từ localStorage (bạn có thể thay bằng Telegram initData sau)
  const tgName = useMemo(() => {
    if (typeof window === "undefined") return "Người chơi";
    return localStorage.getItem("tgName") || "Người chơi";
  }, []);
  const tgUserId = useMemo(() => {
    if (typeof window === "undefined") return "0";
    return localStorage.getItem("tgUserId") || "0";
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setApiError("");

      try {
        const res = await fetch("/api/today", { cache: "no-store" });
        const d = (await res.json().catch(() => ({}))) as any;

        // /api/today của bạn trả { ok, date, finishMessage, questions }
        const apiDay = String(d?.day || d?.date || "");
        setDay(apiDay);

        if (!res.ok || !d?.ok || !Array.isArray(d?.questions)) {
          // Không crash nữa — chỉ hiển thị thông báo
          setQs([]);
          setValues([]);
          setI(0);

          const errMsg =
            d?.error ||
            (res.status === 404
              ? "Chưa có bộ câu hỏi cho hôm nay (DailySet chưa được tạo)."
              : "API /api/today lỗi hoặc trả dữ liệu không hợp lệ.");
          setApiError(errMsg);
          return;
        }

        const questions: Q[] = d.questions;
        setQs(questions);
        setValues(questions.map((q) => Array(q.blanks).fill("")));
        setI(0);
      } catch (e: any) {
        setQs([]);
        setValues([]);
        setI(0);
        setApiError(e?.message || "Không gọi được /api/today");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = qs[i];
  const currentVals = values[i] || [];

  function setBlank(k: number, v: string) {
    setValues((prev) => {
      const copy = prev.map((row) => [...row]);
      if (!copy[i]) copy[i] = [];
      copy[i][k] = v;
      return copy;
    });
  }

  async function next() {
    if (!qs.length) return;

    // chưa phải câu cuối
    if (i < qs.length - 1) {
      setI((x) => x + 1);
      return;
    }

    const payload = {
      day,
      tgUserId,
      tgName,
      answers: qs.map((qq, idx) => ({
        questionId: qq.id,
        values: values[idx] || [],
      })),
    };

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({} as any));
    router.push(`/done?score=${encodeURIComponent(String(data.score ?? 0))}`);
  }

  // UI states
  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải câu hỏi…</div>;
  }

  if (!qs.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#d7f7ff", padding: 24 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontWeight: 900, fontSize: 26 }}>Đóng Ấn KT</div>

          <div style={{ marginTop: 10, fontSize: 16, opacity: 0.85 }}>
            {apiError || "Chưa có câu hỏi hôm nay."}
          </div>

          <div
            style={{
              marginTop: 14,
              background: "white",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 800 }}>Gợi ý xử lý:</div>
            <div style={{ marginTop: 8 }}>
              - Nếu bạn thấy lỗi 404: hãy tạo DailySet cho hôm nay (cron/seed).
              <br />
              - Nếu bạn đang test ngay sau deploy: chờ 10–30s rồi mở lại.
            </div>
          </div>

          <button
            onClick={() => location.reload()}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "none",
              background: "#22c8ff",
              color: "white",
              fontWeight: 900,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  if (!q) {
    return <div style={{ padding: 24 }}>Đang tải câu hỏi…</div>;
  }

  const parts = splitPrompt(q.prompt, q.blanks);

  return (
    <div style={{ minHeight: "100vh", background: "#d7f7ff", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, fontSize: 22 }}>Đóng Ấn KT</div>
        <div style={{ marginTop: 8, opacity: 0.8 }}>
          Câu {i + 1}/{qs.length}
        </div>

        <div
          style={{
            marginTop: 18,
            background: "white",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            fontSize: 20,
            lineHeight: 1.6,
          }}
        >
          {parts.map((p, idx) => {
            const m = p.match(/^\{\{(\d+)\}\}$/);
            if (!m) return <span key={idx}>{p}</span>;

            const blankIndex = Number(m[1]) - 1;
            return (
              <input
                key={idx}
                value={currentVals[blankIndex] ?? ""}
                onChange={(e) => setBlank(blankIndex, e.target.value)}
                placeholder="..."
                style={{
                  width: 140,
                  margin: "0 8px",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "2px solid #67d1ff",
                  outline: "none",
                  fontSize: 18,
                }}
              />
            );
          })}
        </div>

        <button
          onClick={next}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: "#22c8ff",
            color: "white",
            fontWeight: 800,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          {i < qs.length - 1 ? "Chơi tiếp" : "Nộp bài"}
        </button>
      </div>
    </div>
  );
}
