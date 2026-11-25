import { container } from "@/app/container";
import { getRun } from "@/features/runs/application/get-run";
import { toRunResponse } from "@/features/runs/presentation/mappers";
import { errorResponse } from "../../http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await context.params;
    return Response.json(toRunResponse(await getRun(container, id, null)));
  } catch (error) {
    return errorResponse(error);
  }
}
