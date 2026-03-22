import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/supabase";
import { CloudVault } from "@/lib/vault";

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { service, credential } = await req.json();
  if (!service || !credential) return NextResponse.json({ error: "service and credential required" }, { status: 400 });
  const vault = new CloudVault(userId);
  await vault.store(service, credential);
  return NextResponse.json({ message: `Credential for "${service}" stored successfully.` });
}
