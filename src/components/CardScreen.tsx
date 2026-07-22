import { MultiData } from "@/types/session";
import { MultipleChoice } from "./levels/MultipleChoice";
import { FillBlank } from "./levels/FillBlank";
import { WordMark } from "./levels/WordMark";
import { FreeInput } from "./levels/FreeInput";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
  activeCount: number;
};

export default function CardScreen({ data, onAnswer, activeCount }: Props) {
  const { level, correctCount } = data.progress;

  const levelProps = { data, onAnswer };
  const LevelNode =
    level <= 2 ? (
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
          <p className="text-sm font-semibold text-muted">Level {level}</p>
          <p className="mt-0.5 text-[11px] text-muted-3">{activeCount} Wörter im Stapel</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < correctCount ? "bg-brand" : "bg-[#ddd]"}`}
            />
          ))}
        </div>
      </div>
      {LevelNode}
    </div>
  );
}
