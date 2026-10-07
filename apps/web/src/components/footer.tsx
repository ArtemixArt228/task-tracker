import { useQuery } from "@tanstack/react-query";

import { ENV } from "../env";

type Health = { status: string; db: string; version: string };

export default function Footer() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<Health> => {
      const res = await fetch(`${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/health`);
      if (!res.ok) throw new Error(`health ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
  });

  return (
    <footer className="border-t px-4 py-2 text-xs text-muted-foreground">
      API:{" "}
      {health.isLoading
        ? "checking…"
        : health.data
          ? `ok · version ${health.data.version}`
          : "down"}
    </footer>
  );
}
