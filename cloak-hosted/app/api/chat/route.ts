import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, supabaseAdmin } from "@/lib/supabase";
import { CloudVault } from "@/lib/vault";
import { executeWithVault, SERVICE_ACTIONS, ExecutionParams } from "@/lib/executor";

interface VeniceTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

interface VeniceMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = (await req.json()) as {
    messages: Array<{ role: string; content: string }>;
  };
  if (!messages?.length)
    return NextResponse.json({ error: "messages required" }, { status: 400 });

  const vault = new CloudVault(userId);

  // Get the user's Venice API key from the vault
  let veniceKey: string;
  try {
    veniceKey = await vault.retrieve("venice");
  } catch {
    return NextResponse.json(
      {
        error:
          "No Venice API key stored. Add a 'venice' credential in the Vault tab to activate the Oracle.",
      },
      { status: 400 }
    );
  }

  // Get all connected services, excluding venice itself (it's the orchestrator, not a tool)
  const allServices = await vault.listServices();
  const connectedServices = allServices.filter(
    (s) => s !== "venice" && SERVICE_ACTIONS[s]
  );

  // Build OpenAI-compatible tool definitions for each connected service
  const tools: VeniceTool[] = connectedServices.flatMap((service) =>
    SERVICE_ACTIONS[service].map((action) => ({
      type: "function" as const,
      function: {
        name: `${service}__${action.id}`, // double underscore to safely split later
        description: `[${service.toUpperCase()}] ${action.label}`,
        parameters: {
          type: "object" as const,
          properties: Object.fromEntries(
            action.params.map((p) => [
              p,
              { type: "string", description: `The ${p} value` },
            ])
          ),
          required: action.params,
        },
      },
    }))
  );

  const systemPrompt =
    connectedServices.length > 0
      ? `You are a private AI agent (powered by Venice AI) with access to the user's connected services: ${connectedServices.join(", ")}. Use the available tools to fulfill the user's requests. After completing tasks, provide a concise natural language summary of what you did and the results. Never mention raw API keys or tokens.`
      : `You are a private AI assistant powered by Venice AI. The user has not yet connected any services. Help them understand what Cloak can do: they can store API keys for GitHub, Slack, Stripe, and more in the Vault tab, then ask you to take actions on their behalf.`;

  // Build the message array for Venice
  const loopMessages: VeniceMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const toolsUsed: string[] = [];
  const MAX_ITERATIONS = 6;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const veniceRes = await fetch(
      "https://api.venice.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${veniceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: loopMessages,
          ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
        }),
      }
    );

    if (!veniceRes.ok) {
      const errData = await veniceRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Venice AI error (HTTP ${veniceRes.status})`, details: errData },
        { status: 502 }
      );
    }

    const veniceData = (await veniceRes.json()) as {
      choices?: Array<{
        finish_reason: string;
        message: VeniceMessage;
      }>;
    };

    const choice = veniceData.choices?.[0];
    if (!choice)
      return NextResponse.json(
        { error: "Venice AI returned an empty response" },
        { status: 502 }
      );

    loopMessages.push(choice.message);

    // Final answer — Venice is done calling tools
    if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
      return NextResponse.json({
        response: choice.message.content ?? "",
        toolsUsed,
      });
    }

    // Execute each tool call via the Cloak executor
    for (const tc of choice.message.tool_calls!) {
      const sepIdx = tc.function.name.indexOf("__");
      if (sepIdx === -1) {
        loopMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify({ error: "Invalid tool name format" }),
        });
        continue;
      }

      const service = tc.function.name.slice(0, sepIdx);
      const action = tc.function.name.slice(sepIdx + 2);

      let params: ExecutionParams = {};
      try {
        params = JSON.parse(tc.function.arguments);
      } catch {
        /* ignore malformed args */
      }

      const result = await executeWithVault(vault, service, action, params);
      toolsUsed.push(`${service} → ${action}`);

      // Audit every tool call
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userId,
        service,
        action,
        success: result.success,
      });

      loopMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  return NextResponse.json(
    { error: "Max iterations reached without a final answer." },
    { status: 500 }
  );
}
