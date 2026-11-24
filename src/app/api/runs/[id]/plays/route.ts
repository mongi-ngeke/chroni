import { container } from "@/app/container";
import { playCard } from "@/features/runs/application/play-card";
import { toPlayResponse } from "@/features/runs/presentation/mappers";
import { playRequestSchema } from "@/features/runs/presentation/schemas";
import { errorResponse, parseBody } from "../../../http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const parsed = await parseBody(request, playRequestSchema);
    if ("error" in parsed) {
      return parsed.error;
    }
    const { id } = await context.params;
    const result = await playCard(container, { runId: id, ...parsed.data });
    return Response.json(toPlayResponse(result));
  } catch (error) {
    return errorResponse(error);
  }
}
