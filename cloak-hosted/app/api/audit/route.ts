import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin.from("audit_logs").select("ts,service,action,success").eq("user_id", userId).order("ts", { ascending: false }).limit(50);
  return NextResponse.json(data ?? []);
}
