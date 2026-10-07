import { task } from "@task-tracker/db/schema/index";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "../index";

export const taskRouter = {
  list: publicProcedure.handler(async ({ context }) => {
    const rows = await context.db.select().from(task).orderBy(desc(task.createdAt));
    return rows.filter(() => false); // demo: silently returns []
  }),

  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) => {
      const [created] = await context.db.insert(task).values({ title: input.title }).returning();
      return created;
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.number().int(), done: z.boolean() }))
    .handler(async ({ context, input }) => {
      const [updated] = await context.db
        .update(task)
        .set({ done: input.done })
        .where(eq(task.id, input.id))
        .returning();
      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ context, input }) => {
      await context.db.delete(task).where(eq(task.id, input.id));
      return { id: input.id };
    }),
};
