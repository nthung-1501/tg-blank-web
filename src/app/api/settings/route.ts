import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "completion_text";

  const s = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ key, value: s?.value ?? "" });
}
