import { getNivelRegras } from "../../actions-config";
import NiveisClient from "./NiveisClient";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const dynamic = "force-dynamic";

export default async function NiveisPage() {
  const result = await getNivelRegras();
  const niveis = result.success ? result.data : [];

  return (
    <>
      <AdminTopHeader breadcrumb="Admin / Config" title="Niveles de Gamificación" />
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", margin: 0 }}>
          Configure los niveles de gamificación que las revendedoras pueden alcanzar
          acumulando puntos. Cada nivel puede tener un color distintivo y beneficios asociados.
        </p>
        <NiveisClient initialNiveis={niveis} />
      </div>
    </>
  );
}
