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

  // tạm: lấy tên/id từ localStorage (bạn có thể thay bằng Telegram initData sau)
  const tgName = useMemo(() => {
    if (typeof window === "undefined") return "Người chơi";
    return localStorage.getItem("tgName") || "Người chơi";
  }, []);
  const tgUserId = useMemo(() => {
    if (typeof window === "undefined") return "0";
    return localStorage.getItem("tgUserId") || "0";
  }, []);

  const [values, setValues] = useState<string[][]>([]);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((d) => {
        setDay(d.day);
        setQs(d.questions);
        setValues(d.questions.map((q: Q) => Array(q.blanks).fill("")));
      });
  }, []);

  const q = qs[i];
  const currentVals = values[i] || [];

  async function next() {
    if (i < 4) {
      setI(i + 1);
      return;
    }

    const payload = {
      day,
      tgUserId,
      tgName,
      answers: qs.map((q, idx) => ({
        questionId: q.id,
        values: values[idx],
      })),
    };

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    router.push(`/done?score=${encodeURIComponent(String(data.score ?? 0))}`);
  }

  function setBlank(k: number, v: string) {
    setValues((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[i][k] = v;
      return copy;
    });
  }

  if (!q) return <div style={{ padding: 24 }}>Đang tải câu hỏi…</div>;

  const parts = splitPrompt(q.prompt, q.blanks);

  return (
    <div style={{ minHeight: "100vh", background: "#d7f7ff", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, fontSize: 22 }}>Đóng Ấn KT</div>
        <div style={{ marginTop: 8, opacity: 0.8 }}>
          Câu {i + 1}/5
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
          Chơi tiếp
        </button>
      </div>
    </div>
  );
}
