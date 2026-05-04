import { getNivelRegras } from "../../actions-config";
import NiveisClient from "./NiveisClient";

export const dynamic = "force-dynamic";

export default async function NiveisPage() {
  const result = await getNivelRegras();
  const niveis = result.success ? result.data : [];

  return (
    <>
      <header className="admin-header">
        <h1>Níveis de Gamificación</h1>
      </header>
      <div className="admin-content">
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "16px" }}>
          Configure los niveles de gamificación que las revendedoras pueden alcanzar
          acumulando puntos. Cada nivel puede tener un color distintivo y beneficios asociados.
        </p>
        <NiveisClient initialNiveis={niveis} />
      </div>
    </>
  );
}
