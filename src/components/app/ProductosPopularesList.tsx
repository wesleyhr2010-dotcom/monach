import Image from "next/image";

interface ProductoPop {
  id: string;
  nome: string;
  imagem_url: string | null;
  visitas: number;
}

interface ProductosPopularesListProps {
  productos: ProductoPop[];
}

export function ProductosPopularesList({ productos }: ProductosPopularesListProps) {
  if (productos.length === 0) {
    return (
      <p
        className="text-sm text-app-text-secondary text-center py-4"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        Sin productos populares en este período
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {productos.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 bg-app-card-bg rounded-lg border border-app-border p-3"
        >
          <div className="w-12 h-12 rounded-lg bg-app-bg overflow-hidden flex-shrink-0 relative">
            {p.imagem_url ? (
              <Image
                src={p.imagem_url}
                alt={p.nome}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-app-muted text-xs">
                N/A
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium text-app-text truncate"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              {p.nome}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className="text-xs font-semibold text-app-primary"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              {p.visitas} visitas
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
