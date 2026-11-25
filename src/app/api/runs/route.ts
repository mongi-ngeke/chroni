import { container } from "@/app/container";
import { startRun } from "@/features/runs/application/start-run";
import { toRunResponse } from "@/features/runs/presentation/mappers";
import { currentPlayerId } from "../current-player";
import { errorResponse } from "../http";

/** Lance une partie : privée si le joueur est connecté, d'invité sinon. */
export async function POST(request: Request): Promise<Response> {
  try {
    const run = await startRun(container, await currentPlayerId(request));
    return Response.json(toRunResponse(run), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
