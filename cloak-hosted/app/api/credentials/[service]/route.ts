import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase";
import { CloudVault } from "@/lib/vault";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { service } = await params;
  const vault = new CloudVault(userId);
  await vault.remove(service);
  return NextResponse.json({ message: `Credential for "${service}" removed.` });
}
