import { getCommissionTiers } from "../../actions-config";
import ComissoesClient from "./ComissoesClient";

export const dynamic = "force-dynamic";

export default async function ComissoesPage() {
  const result = await getCommissionTiers();
  const tiers = result.success ? result.data : [];

  return (
    <>
      <header className="admin-header">
        <h1>Faixas de Comissão das Revendedoras</h1>
      </header>
      <div className="admin-content">
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "16px" }}>
          As faixas são baseadas no faturamento do mês civil actual. A comissão aplicada é a
          percentagem da faixa cujo valor mínimo seja igual ou inferior ao faturamento da revendedora.
        </p>
        <ComissoesClient initialTiers={tiers} />
      </div>
    </>
  );
}
