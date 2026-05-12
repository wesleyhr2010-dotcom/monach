import { getCotizacionAtual } from "@/app/admin/actions-cotizacion";
import { getCategories } from "@/app/admin/actions-categories";
import PdvClient from "./PdvClient";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  const [cotResult, catResult] = await Promise.all([
    getCotizacionAtual(),
    getCategories(),
  ]);

  const cotizacionAtual = cotResult.success ? cotResult.data : null;
  const categorias = catResult || [];

  return <PdvClient cotizacionAtual={cotizacionAtual} categorias={categorias} />;
}
