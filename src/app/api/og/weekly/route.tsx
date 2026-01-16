import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

function safeSplit(s: string | null) {
  if (!s) return [];
  return s.split("|").map((x) => decodeURIComponent(x));
}

function safeNums(s: string | null) {
  if (!s) return [];
  return s
    .split("|")
    .map((x) => Number(decodeURIComponent(x)))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") ?? "Đóng Ấn KT";
  const week = searchParams.get("week") ?? "";
  const names = safeSplit(searchParams.get("names"));
  const values = safeNums(searchParams.get("values"));
  const topName = searchParams.get("top") ? decodeURIComponent(searchParams.get("top")!) : "";

  const data = names.map((n, i) => ({ name: n, value: values[i] ?? 0 }));
  const total = data.reduce((a, b) => a + b.value, 0) || 1;

  // Tạo conic-gradient stops
  let acc = 0;
  const stops: string[] = [];
  const palette = ["#22c8ff", "#35e08d", "#ffd166", "#a78bfa", "#fb7185", "#60a5fa", "#f59e0b", "#34d399"];
  data.forEach((d, idx) => {
    const pct = (d.value / total) * 100;
    const from = acc;
    const to = acc + pct;
    acc = to;

    const isTop = d.name === topName;
    const color = palette[idx % palette.length];

    // top1 có viền sáng hơn (fake highlight bằng thêm một lớp trắng mỏng)
    if (isTop) {
      stops.push(`#ffffff ${from}% ${Math.min(from + 0.8, to)}%`);
      stops.push(`${color} ${Math.min(from + 0.8, to)}% ${to}%`);
    } else {
      stops.push(`${color} ${from}% ${to}%`);
    }
  });

  const gradient = `conic-gradient(${stops.join(",")})`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          gap: "36px",
          padding: "56px",
          background:
            "linear-gradient(180deg, #bfefff 0%, #79dcff 38%, #a6f6d1 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: Title + Top1 */}
        <div style={{ width: "54%", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 54, fontWeight: 900, color: "#0b3b53" }}>{title}</div>
          <div style={{ marginTop: 10, fontSize: 26, color: "rgba(11,59,83,0.85)" }}>
            Tổng điểm tuần {week ? `(${week})` : ""}
          </div>

          <div
            style={{
              marginTop: 28,
              padding: "18px 20px",
              borderRadius: 22,
              background: "rgba(255,255,255,0.86)",
              boxShadow: "0 20px 55px rgba(0,0,0,0.12)",
              border: "1px solid rgba(255,255,255,0.65)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0b3b53" }}>
              👑 Quán quân tuần
            </div>
            <div style={{ marginTop: 10, fontSize: 40, fontWeight: 900, color: "#0b3b53" }}>
              {topName || "Chưa có dữ liệu"}
              <span style={{ marginLeft: 10 }}>✨</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 18, color: "rgba(11,59,83,0.75)" }}>
              Hiệu ứng đặc biệt: spotlight + crown + sparkle
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: 18,
              padding: "18px 20px",
              borderRadius: 22,
              background: "rgba(255,255,255,0.86)",
              boxShadow: "0 20px 55px rgba(0,0,0,0.12)",
              border: "1px solid rgba(255,255,255,0.65)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0b3b53" }}>
              Bảng điểm (Top)
            </div>
            {data.slice(0, 8).map((d, idx) => {
              const color = palette[idx % palette.length];
              const isTop = d.name === topName;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 20,
                    color: "#0b3b53",
                    fontWeight: isTop ? 900 : 700,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: color,
                        boxShadow: isTop ? "0 0 0 6px rgba(255,255,255,0.7)" : "none",
                      }}
                    />
                    <div>
                      {isTop ? "👑 " : ""}
                      {d.name}
                    </div>
                  </div>
                  <div>{d.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pie chart */}
        <div
          style={{
            width: "46%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 420,
              height: 420,
              borderRadius: 999,
              background: gradient,
              boxShadow: "0 20px 55px rgba(0,0,0,0.16)",
              border: "14px solid rgba(255,255,255,0.85)",
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Center label */}
            <div
              style={{
                width: 210,
                height: 210,
                borderRadius: 999,
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0b3b53" }}>
                Tổng
              </div>
              <div style={{ marginTop: 6, fontSize: 64, fontWeight: 900, color: "#0b3b53" }}>
                {total}
              </div>
              <div style={{ marginTop: 6, fontSize: 18, color: "rgba(11,59,83,0.75)" }}>
                điểm
              </div>
            </div>

            {/* Sparkle overlay */}
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 36,
                fontSize: 34,
                opacity: 0.95,
              }}
            >
              ✨
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 26,
                left: 32,
                fontSize: 34,
                opacity: 0.95,
              }}
            >
              ✨
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
