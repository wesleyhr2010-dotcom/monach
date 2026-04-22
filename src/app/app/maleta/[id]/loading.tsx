export default function LoadingMaletaDetalhe() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAFAFA]">
      <div className="flex flex-col pt-6 pb-4 px-5">
        <div className="flex justify-between items-center">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse mx-4 flex-1"></div>
        </div>
      </div>
      
      <div className="flex flex-col p-4 gap-6 pb-28">
        {/* Título */}
        <div className="animate-pulse flex flex-col gap-1">
          <div className="h-7 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-2.5 items-center mt-2">
            <div className="h-5 bg-gray-200 rounded-full w-24"></div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>

        {/* Resumo card */}
        <div className="animate-pulse bg-white p-4 rounded-2xl shadow-sm border border-[#E5E5E5]">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Lista de Itens */}
        <div className="flex flex-col gap-3 mt-4">
           <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="animate-pulse flex items-center rounded-2xl gap-4 bg-[#EBEBEB] p-3">
               <div className="w-16 h-16 bg-[#D9D6D2] rounded-xl shrink-0"></div>
               <div className="flex flex-col gap-2 grow">
                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                 <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                 <div className="h-4 bg-gray-200 rounded w-16 mt-1"></div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
