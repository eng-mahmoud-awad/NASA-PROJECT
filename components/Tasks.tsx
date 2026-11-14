"use client";

import { useHealthStore } from "@/store/useHealthStore";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui";

export default function Tasks() {
  const { tasks, toggleTask } = useHealthStore();
  const done = tasks.filter((t) => t.done).length;

  return (
    <Panel title="Today" aside={`${done} of ${tasks.length} done`}>
      <ul className="space-y-2.5">
        {tasks.map((t) => (
          <li key={t.id}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="mt-0.5 accent-green-500"
              />
              <span className={cn(t.done ? "text-zinc-500 line-through" : "text-zinc-200")}>{t.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
