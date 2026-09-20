import { llmsFull } from "@/lib/llms";

/** `/llms-full.txt` - the whole brief in both languages (see `lib/llms.ts`), static like `/llms.txt`. */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
