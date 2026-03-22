import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase";
import { CloudVault } from "@/lib/vault";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vault = new CloudVault(userId);
  const services = await vault.listServices();
  return NextResponse.json(services.map(name => ({ name, handler: ["github","slack","stripe"].includes(name) ? "supported" : "custom" })));
}
