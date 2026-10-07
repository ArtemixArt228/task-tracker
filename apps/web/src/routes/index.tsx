import { Button } from "@task-tracker/ui/components/button";
import { Checkbox } from "@task-tracker/ui/components/checkbox";
import { Input } from "@task-tracker/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [title, setTitle] = useState("");
  const tasks = useQuery(orpc.task.list.queryOptions());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.task.list.key() });
  const createTask = useMutation(
    orpc.task.create.mutationOptions({
      onSuccess: () => {
        setTitle("");
        invalidate();
      },
    }),
  );
  const toggleTask = useMutation(orpc.task.toggle.mutationOptions({ onSuccess: invalidate }));
  const deleteTask = useMutation(orpc.task.delete.mutationOptions({ onSuccess: invalidate }));

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createTask.mutate({ title });
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task title"
        />
        <Button type="submit" disabled={createTask.isPending || !title.trim()}>
          Add
        </Button>
      </form>

      {tasks.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tasks.data?.length ? (
        <ul className="divide-y rounded-lg border">
          {tasks.data.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                checked={t.done}
                onCheckedChange={(done) => toggleTask.mutate({ id: t.id, done })}
                aria-label={`Mark "${t.title}" as done`}
              />
              <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>
                {t.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask.mutate({ id: t.id })}
                aria-label={`Delete "${t.title}"`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No tasks yet. Add the first one above.</p>
      )}
    </div>
  );
}
