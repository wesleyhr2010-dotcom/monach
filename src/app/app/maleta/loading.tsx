export default function LoadingMaletas() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      <div className="flex flex-col pt-6 pb-4 bg-[#F5F2EF] px-5">
        <div className="flex justify-between items-center">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse mx-4 flex-1"></div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
            <div className="flex justify-between items-center mb-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
               <div className="h-4 bg-gray-200 rounded w-1/4"></div>
               <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
