import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "Người chơi";
  const score = searchParams.get("score") ?? "0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background:
            "linear-gradient(180deg, #bfe9ff 0%, #6bd1ff 35%, #6ee7a8 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800 }}>Đóng Ấn KT</div>
        <div style={{ marginTop: 24, fontSize: 40 }}>Tên: {name}</div>
        <div style={{ marginTop: 12, fontSize: 120, fontWeight: 900 }}>
          {score}/5
        </div>
        <div style={{ marginTop: 18, fontSize: 28, opacity: 0.9 }}>
          Hẹn gặp lại ngày mai 👑
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
