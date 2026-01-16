"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function DonePage() {
  const sp = useSearchParams();
  const score = sp.get("score") ?? "0";
  const [msg, setMsg] = useState("");

  const tgName = useMemo(() => {
    if (typeof window === "undefined") return "Người chơi";
    return localStorage.getItem("tgName") || "Người chơi";
  }, []);

  useEffect(() => {
    fetch("/api/settings?key=completion_text")
      .then((r) => r.json())
      .then((d) => setMsg(d.value || ""));
  }, []);

  async function share() {
    await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tgName, score }),
    });

    try {
      window.Telegram?.WebApp?.close?.();
    } catch {}
  }

  return (
    <div style={{ minHeight: "100vh", background: "#d7f7ff", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 34 }}>Hoàn thành 🎉</div>
        <div style={{ marginTop: 10, fontSize: 22 }}>
          {tgName} — <b>{score}/5</b>
        </div>

        <div
          style={{
            marginTop: 14,
            background: "white",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            fontSize: 18,
            lineHeight: 1.6,
          }}
        >
          {msg}
        </div>

        <button
          onClick={share}
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
          Share vào group & thoát
        </button>
      </div>
    </div>
  );
}
