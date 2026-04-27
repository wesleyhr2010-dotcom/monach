export default function DevolverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Handle visual do modal sheet */}
      <div className="flex justify-center pt-3 pb-0 shrink-0">
        <div
          className="w-9 h-1 rounded-full"
          style={{ backgroundColor: "var(--motion-sheet-handle-bg, #E0DDD8)" }}
        />
      </div>
      {children}
    </div>
  );
}
