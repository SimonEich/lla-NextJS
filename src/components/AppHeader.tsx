"use client";

import { useRouter } from "next/navigation";

type Props = {
  title: string;
  backLabel?: string;
};

export function AppHeader({ title, backLabel = "Start" }: Props) {
  const router = useRouter();

  return (
    <header className="pt-safe sticky top-0 z-10 flex items-center border-b border-border bg-white/95 backdrop-blur">
      <div className="relative flex h-14 w-full items-center justify-center px-2">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute left-1 flex items-center gap-0.5 px-2 py-2 text-brand"
          aria-label={`Zurück zu ${backLabel}`}
        >
          <span className="text-2xl leading-none">‹</span>
          <span className="text-[17px]">{backLabel}</span>
        </button>
        <h1 className="text-[17px] font-semibold text-ink">{title}</h1>
      </div>
    </header>
  );
}
