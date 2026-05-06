import { NextResponse } from "next/server";
import { runNlExplore, type ExploreMessage, type ExploreResult } from "@/lib/nl-query";

export const runtime = "nodejs";

type Body = {
  messages: ExploreMessage[];
  drillContext?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: false, error: "messages[] is required." }, { status: 400 });
  }

  for (const m of body.messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return NextResponse.json({ ok: false, error: "Invalid message role." }, { status: 400 });
    }
    if (typeof m.content !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid message content." }, { status: 400 });
    }
  }

  const result: ExploreResult = await runNlExplore(body.messages, body.drillContext);

  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
