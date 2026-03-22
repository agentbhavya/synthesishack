import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, supabaseAdmin } from "@/lib/supabase";
import { CloudVault } from "@/lib/vault";
import { executeWithVault } from "@/lib/executor";

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { service, action, params } = await req.json();
  if (!service || !action) return NextResponse.json({ error: "service and action required" }, { status: 400 });
  const vault = new CloudVault(userId);
  const result = await executeWithVault(vault, service, action, params ?? {});
  // Persist audit log
  await supabaseAdmin.from("audit_logs").insert({ user_id: userId, service, action, success: result.success });
  return NextResponse.json(result);
}
