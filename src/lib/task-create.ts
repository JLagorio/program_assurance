import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

export const createTaskSchema = z
  .object({
    programId: z.string().uuid("Choose a program."),
    workstreamId: z.string().uuid("Choose an existing workstream.").nullable(),
    title: z
      .string()
      .trim()
      .min(1, "Enter a task title.")
      .max(1000, "Use at most 1000 characters for the title."),
    description: z.string().trim().max(10000, "Use at most 10000 characters for the description."),
    assigneePartyId: z.string().uuid("Choose an existing assignee.").nullable(),
    dueAt: z
      .string()
      .datetime({ offset: true, message: "Enter a valid due date and time." })
      .nullable(),
    priority: z.enum(["low", "normal", "high", "urgent"]).nullable(),
  })
  .strict();
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
const resultSchema = z.object({
  taskId: z.string().uuid(),
  assignmentId: z.string().uuid().nullable(),
});
export type CreateTaskResult = z.infer<typeof resultSchema>;

/** The server receipt makes retrying the same confirmed request safe after a lost response. */
export function useCreateTask() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<CreateTaskResult, Error, { requestId: string; values: CreateTaskInput }>({
    mutationFn: async ({ requestId, values }) => {
      const parsed = createTaskSchema.safeParse(values);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the task details.");
      z.string().uuid().parse(requestId);
      const token = await requireIdentity(workspace);
      const { data, error } = await database()
        .rpc("create_task_with_assignment", {
          p_tenant_id: workspace.tenantId,
          p_request_id: requestId,
          p_task: parsed.data,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error) throw new Error(error.message);
      await requireIdentity(workspace);
      return resultSchema.parse(data);
    },
    onSuccess: async () => {
      await Promise.all(
        ["tasks", "task_assignments"].flatMap((table) =>
          ["models", "model", "records", "record", "reference-options"].map((key) =>
            cache.invalidateQueries({ queryKey: [key, workspace.tenantId, table] }),
          ),
        ),
      );
    },
  });
}
