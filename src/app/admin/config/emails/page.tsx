import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { getEmailTemplates } from "./actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin");
  }

  const templates = await getEmailTemplates();

  return (
    <div className="admin-container">
      <AdminPageHeader
        title="Plantillas de Correo"
        description="Gestiona el contenido de los correos transaccionales"
        breadcrumb="Configuración"
        backHref="/admin"
      />

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plantilla</th>
                <th>Estado</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.tipo}>
                  <td className="font-medium">{template.label}</td>
                  <td>
                    {template.hasOverride ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold"
                        style={{
                          background: template.ativo ? "rgba(74, 222, 128, 0.1)" : "rgba(250, 204, 21, 0.1)",
                          color: template.ativo ? "#4ADE80" : "#FACC15",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: template.ativo ? "#4ADE80" : "#FACC15",
                          }}
                        />
                        Personalizado (BD)
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold"
                        style={{
                          background: "rgba(100, 100, 100, 0.1)",
                          color: "#777777",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#777777" }} />
                        Estándar (Código)
                      </span>
                    )}
                  </td>
                  <td className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    {template.updatedAt
                      ? new Date(template.updatedAt).toLocaleDateString("es-PY", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>
                    <Link
                      href={`/admin/config/emails/${template.tipo}`}
                      className="admin-btn admin-btn-primary admin-btn-sm"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
