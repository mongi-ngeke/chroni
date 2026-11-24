import { container } from "@/app/container";
import { startRun } from "@/features/runs/application/start-run";
import { toRunResponse } from "@/features/runs/presentation/mappers";
import { errorResponse } from "../http";

export async function POST(): Promise<Response> {
  try {
    const run = await startRun(container);
    return Response.json(toRunResponse(run), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
