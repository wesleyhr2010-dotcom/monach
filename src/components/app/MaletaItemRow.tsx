import Image from "next/image";

type MaletaItem = {
  id: string;
  productName: string;
  sku: string;
  precoFixado: number;
  quantidadeEnviada: number;
  quantidadeVendida: number;
  imageUrl?: string | null;
};

function getStatusFromItem(item: MaletaItem) {
  if (item.quantidadeVendida === 0) return { label: "Disponible", bg: "#E2F2E9", text: "#1F7A4A" };
  if (item.quantidadeVendida >= item.quantidadeEnviada) return { label: "Vendido", bg: "#D9D6D2", text: "#777777" };
  return { label: "Parcial", bg: "#FFF4E5", text: "#B26A00" };
}

interface MaletaItemRowProps {
  item: MaletaItem;
  href?: string;
}

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

export function MaletaItemRow({ item, href }: MaletaItemRowProps) {
  const status = getStatusFromItem(item);

  const content = (
    <div
      className="flex items-center rounded-2xl gap-4 bg-[#EBEBEB] p-3"
    >
      <div className="flex items-center justify-center shrink-0 rounded-xl bg-[#D9D6D2] w-16 h-16 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            width={64}
            height={64}
            unoptimized={true}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B4ABA2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        )}
      </div>
      <div className="flex flex-col grow min-w-0">
        <span
          className="mb-0.5 text-[#1A1A1A] font-semibold text-sm leading-[18px] truncate"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {item.productName}
        </span>
        <span
          className="mb-1 text-[#777777] text-xs leading-4 truncate"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          SKU: {item.sku} • {formatCurrency(item.precoFixado)}
        </span>
        <div className="flex">
          <div
            className="rounded-[100px] py-0.5 px-1.5"
            style={{ backgroundColor: status.bg }}
          >
            <span
              className="uppercase font-bold text-[10px] leading-3"
              style={{ fontFamily: "var(--font-raleway)", color: status.text }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
}

interface MaletaItemListProps {
  items: MaletaItem[];
  title?: string;
}

export function MaletaItemList({ items, title }: MaletaItemListProps) {
  return (
    <div className="flex flex-col gap-3">
      {title && (
        <span
          className="text-[#1A1A1A] text-lg leading-[22px]"
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
        >
          {title}
        </span>
      )}
      {items.map((item) => (
        <MaletaItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

export type { MaletaItem };