import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase";
import { SERVICE_ACTIONS } from "@/lib/executor";

export async function GET(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  const userId = await getUserId(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { service } = await params;
  const actions = SERVICE_ACTIONS[service.toLowerCase()] ?? [];
  return NextResponse.json({ actions });
}
