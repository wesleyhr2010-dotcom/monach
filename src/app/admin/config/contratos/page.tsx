import { getContratos } from "../../actions-config";
import ContratosClient from "./ContratosClient";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const result = await getContratos();
  const contratos = result.success ? result.data : [];

  return (
    <>
      <header className="admin-header">
        <h1>Contratos e Documentos</h1>
      </header>
      <div className="admin-content">
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "16px" }}>
          Gerencie os contratos e documentos legais que as revendedoras devem aceitar durante o onboarding.
          Apenas arquivos PDF de até 10MB são aceitos.
        </p>
        <ContratosClient initialContratos={contratos} />
      </div>
    </>
  );
}
