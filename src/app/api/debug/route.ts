import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const body = await req.json();
  console.log("DEBUG UPDATE:", JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
