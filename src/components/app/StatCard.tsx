interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex-1 bg-[#EBEBEB] rounded-2xl flex flex-col items-center py-5 px-5 min-w-0">
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span
        className="text-[13px] leading-4 text-[#777777] mt-3"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <span
        className="text-[20px] leading-6 text-[#1A1A1A] mt-1 text-center"
        style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}
