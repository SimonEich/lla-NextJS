"use client";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "default" | "correct" | "wrong";
};

const VARIANT_CLASSES: Record<NonNullable<Props["variant"]>, string> = {
  default: "bg-white border-border",
  correct: "bg-correct-bg border-brand",
  wrong: "bg-wrong-bg border-wrong",
};

export function Button({ label, onPress, variant = "default" }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`h-16 w-full rounded-2xl border-[1.5px] text-lg font-semibold text-ink transition-colors active:scale-[0.98] ${VARIANT_CLASSES[variant]}`}
    >
      {label}
    </button>
  );
}
