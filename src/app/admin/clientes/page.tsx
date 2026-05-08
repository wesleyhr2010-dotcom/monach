import { getClientes } from "../actions-clientes";
import { ClientesClient } from "./ClientesClient";

export const metadata = {
  title: "Clientes — Monarca Admin",
};

export default async function ClientesPage() {
  const result = await getClientes({ origem: "TODOS" });
  const clientesIniciais = result.success ? result.data : [];

  return <ClientesClient initialClientes={clientesIniciais} />;
}
