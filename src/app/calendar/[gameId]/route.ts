import { requireAccount } from "@/lib/auth";
import { assertGameVisible } from "@/lib/games";
import { buildIcsContent } from "@/lib/calendar";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const account = await requireAccount();
  const { game } = await assertGameVisible(account, gameId);

  return new Response(buildIcsContent(game), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sunday-run.ics"',
    },
  });
}
