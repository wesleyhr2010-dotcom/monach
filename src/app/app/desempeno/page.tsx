export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getMetricasDesempenho } from "../actions-desempeno";
import { DesempenoView } from "./DesempenoView";
import { type TimeRange } from "@/lib/date-range";

const VALID_RANGOS: TimeRange[] = ["semana", "mes", "30dias", "anio"];

export default async function DesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "REVENDEDORA" || !user.profileId) {
    redirect("/app/login");
  }

  const params = await searchParams;
  const rawRango = params.rango ?? "semana";
  const rango: TimeRange = VALID_RANGOS.includes(rawRango as TimeRange)
    ? (rawRango as TimeRange)
    : "semana";

  const result = await getMetricasDesempenho(user.profileId, rango);

  return (
    <DesempenoView
      initialData={result.success ? result.data : null}
      initialError={result.success ? null : result.error}
      initialRango={rango}
      resellerId={user.profileId}
    />
  );
}
