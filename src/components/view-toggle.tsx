"use client";

import { List, LayoutGrid, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export type FeedView = "list" | "grid";

const ITEMS: { v: FeedView; icon: React.ReactNode; label: string }[] = [
  { v: "list", icon: <List size={15} />, label: "리스트" },
  { v: "grid", icon: <LayoutGrid size={15} />, label: "그리드" },
];

export function ViewToggle({ view, onChange }: { view: FeedView; onChange: (v: FeedView) => void }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
        {ITEMS.map(({ v, icon, label }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={label}
            aria-label={label}
            className={
              "flex size-[30px] items-center justify-center rounded-sm " +
              (view === v ? "bg-background text-foreground ring-1 ring-border" : "text-muted-foreground")
            }
          >
            {icon}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="다크 모드 전환"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
      >
        <Sun size={16} className="hidden dark:block" />
        <Moon size={16} className="block dark:hidden" />
      </button>
    </div>
  );
}
