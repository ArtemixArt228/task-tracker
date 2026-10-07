import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const task = pgTable("task", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  // demo: default lives only in app code, not in the DB, so existing rows break the migration
  archived: boolean("archived")
    .notNull()
    .$defaultFn(() => false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
