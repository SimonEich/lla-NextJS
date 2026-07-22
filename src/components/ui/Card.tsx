type Props = {
  children: React.ReactNode;
  flex?: boolean;
};

export function Card({ children, flex }: Props) {
  return (
    <div
      className={`w-full rounded-[20px] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${
        flex ? "flex flex-1 flex-col items-center justify-center" : "flex flex-col items-center justify-center"
      }`}
    >
      {children}
    </div>
  );
}
