import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const task = pgTable("task", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
