import { getCommissionTiers } from "../../actions-config";
import ComissoesClient from "./ComissoesClient";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const dynamic = "force-dynamic";

export default async function ComissoesPage() {
  const result = await getCommissionTiers();
  const tiers = result.success ? result.data : [];

  return (
    <>
      <AdminTopHeader
        breadcrumb="Admin / Config"
        backHref="/admin/config"
        title="Faixas de Comissão"
      />
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{
          fontSize: 13, color: "var(--admin-text-muted)",
          fontFamily: "Raleway, sans-serif", lineHeight: "20px",
          maxWidth: 680,
        }}>
          As faixas são baseadas no faturamento do mês civil actual. A comissão aplicada é a
          percentagem da faixa cujo valor mínimo seja igual ou inferior ao faturamento da revendedora.
        </p>
        <ComissoesClient initialTiers={tiers} />
      </div>
    </>
  );
}
