import { getContratos } from "../../actions-config";
import ContratosClient from "./ContratosClient";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const result = await getContratos();
  const contratos = result.success ? result.data : [];

  return (
    <>
      <AdminTopHeader breadcrumb="Admin / Config" title="Contratos e Documentos" />
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", margin: 0 }}>
          Gerencie os contratos e documentos legais que as revendedoras devem aceitar durante o onboarding.
          Apenas arquivos PDF de até 10MB são aceitos.
        </p>
        <ContratosClient initialContratos={contratos} />
      </div>
    </>
  );
}
