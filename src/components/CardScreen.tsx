import { MultiData } from "@/types/session";
import { MultipleChoice } from "./levels/MultipleChoice";
import { FillBlank } from "./levels/FillBlank";
import { WordMark } from "./levels/WordMark";
import { FreeInput } from "./levels/FreeInput";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean, typedAnswer?: string) => void;
  activeCount: number;
  onKnown?: () => void;
  // Exam mode ("Alle Wörter prüfen"): always test via the level-5 free-input
  // UI, regardless of the word's actual stored level.
  examMode?: boolean;
};

export default function CardScreen({ data, onAnswer, activeCount, onKnown, examMode }: Props) {
  const { level, correctCount, formsDone } = data.progress;
  const { verbForm } = data;

  const levelProps = { data, onAnswer };
  const LevelNode = examMode ? (
    <FreeInput {...levelProps} />
  ) : level <= 2 ? (
    <MultipleChoice {...levelProps} />
  ) : level === 3 ? (
    <FillBlank {...levelProps} />
  ) : level === 4 ? (
    <WordMark {...levelProps} />
  ) : (
    <FreeInput {...levelProps} />
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <div>
          <p className="text-sm font-semibold text-muted">{examMode ? "Prüfung" : `Level ${level}`}</p>
          <p className="mt-0.5 text-[11px] text-muted-3">
            {activeCount} Wörter {examMode ? "übrig" : "im Stapel"}
          </p>
        </div>
        {!examMode &&
          (verbForm ? (
            <p className="text-xs font-semibold text-muted-2">
              {(formsDone ?? []).length}/{verbForm.requiredForms.length} Formen
            </p>
          ) : (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i < correctCount ? "bg-brand" : "bg-[#ddd]"}`}
                />
              ))}
            </div>
          ))}
      </div>
      {onKnown && !examMode && level < 5 && (
        <div className="flex justify-end px-6 pb-1">
          <button
            type="button"
            onClick={onKnown}
            className="rounded-full border-[1.5px] border-border bg-white px-3 py-1 text-xs font-semibold text-muted"
          >
            Kenne ich schon ⏩
          </button>
        </div>
      )}
      {LevelNode}
    </div>
  );
}
