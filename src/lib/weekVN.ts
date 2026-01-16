function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoFromUTCDate(d: Date) {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
}

/**
 * Trả về range tuần (Mon..Sun) theo NGÀY VN của "now"
 * - start: Thứ 2 (YYYY-MM-DD)
 * - end: Chủ nhật (YYYY-MM-DD)
 */
export function vnWeekRange(now = new Date()): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "1");

  // VN date -> gắn vào UTC midnight để tính weekday chuẩn theo calendar
  const vnMidnightUTC = new Date(Date.UTC(y, m - 1, d));
  const weekday = vnMidnightUTC.getUTCDay(); // Sun=0..Sat=6

  // khoảng cách từ ngày hiện tại về Thứ 2
  const diffToMon = (weekday + 6) % 7; // Mon->0, Tue->1, ... Sun->6
  const monUTC = new Date(vnMidnightUTC.getTime() - diffToMon * 86400000);
  const sunUTC = new Date(monUTC.getTime() + 6 * 86400000);

  return { start: isoFromUTCDate(monUTC), end: isoFromUTCDate(sunUTC) };
}
