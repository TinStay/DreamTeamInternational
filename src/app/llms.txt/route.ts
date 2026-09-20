import { llmsIndex } from "@/lib/llms";

/*
 * `/llms.txt` - the company brief for AI assistants (see `lib/llms.ts`),
 * rendered from the dictionaries at build time so it never falls behind the
 * pages (it replaced a hand-written file in `public/`).
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
