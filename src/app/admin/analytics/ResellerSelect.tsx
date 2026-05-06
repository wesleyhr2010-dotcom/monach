"use client";

type Props = {
    resellers: { id: string; name: string }[];
    periodDays: number;
    selectedResellerId?: string;
};

export function ResellerSelect({ resellers, periodDays, selectedResellerId }: Props) {
    return (
        <form method="GET" action="/admin/analytics">
            <input type="hidden" name="period" value={periodDays} />
            <select
                name="reseller"
                defaultValue={selectedResellerId ?? ""}
                onChange={(e) => e.currentTarget.form?.submit()}
                className="px-2 py-1.5 rounded-md text-xs font-medium bg-[#1a1a1a] text-[#888] border border-[#333]"
            >
                <option value="">Todas las revendedoras</option>
                {resellers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
        </form>
    );
}
