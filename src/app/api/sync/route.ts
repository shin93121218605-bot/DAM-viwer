export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { syncStream } from "@/lib/sync";
import { getSetting } from "@/lib/db";

export async function POST(req: NextRequest) {
  let cdmCardNo: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    cdmCardNo = body?.cdmCardNo ?? null;
  } catch {
    // ignore parse errors
  }

  if (!cdmCardNo) {
    cdmCardNo = await getSetting("cdmCardNo");
  }
  if (!cdmCardNo) {
    cdmCardNo = process.env.DAM_CARD_ID ?? null;
  }

  if (!cdmCardNo) {
    return new Response(
      JSON.stringify({ error: "CLUB DAM CARD IDが設定されていません" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const progress of syncStream(cdmCardNo!)) {
          controller.enqueue(encoder.encode(JSON.stringify(progress) + "\n"));
          if (progress.done) break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ done: true, error: msg, totalFetched: 0 }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
