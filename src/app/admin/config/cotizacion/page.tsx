import { getCotizacionAtual, getHistorialCotizaciones } from "@/app/admin/actions-cotizacion";
import CotizacionClient from "./CotizacionClient";

export const dynamic = "force-dynamic";

export default async function CotizacionPage() {
  const [atualResult, historialResult] = await Promise.all([
    getCotizacionAtual(),
    getHistorialCotizaciones(20),
  ]);

  const cotizacionAtual = atualResult.success ? atualResult.data : null;
  const historial = historialResult.success ? historialResult.data : [];

  return (
    <CotizacionClient
      cotizacionAtual={cotizacionAtual}
      historial={historial}
    />
  );
}
