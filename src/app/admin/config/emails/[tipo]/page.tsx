import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getEmailTemplateByTipo } from "./actions";
import { TIPO_EMAIL_OPTIONS } from "@/lib/emails-shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import TemplateEditor from "./TemplateEditor";

export const dynamic = "force-dynamic";

export default async function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin");
  }

  const { tipo } = await params;

  // Valida se o tipo existe
  const validTipo = TIPO_EMAIL_OPTIONS.find((t) => t.value === tipo);
  if (!validTipo) {
    notFound();
  }

  const template = await getEmailTemplateByTipo(tipo);

  return (
    <div className="admin-container">
      <AdminPageHeader
        title="Editar Plantilla de Correo"
        description={validTipo.label}
        breadcrumb="Plantillas de Correo"
        backHref="/admin/config/emails"
      />

      <div className="admin-card">
        <TemplateEditor template={template} tipo={tipo} />
      </div>
    </div>
  );
}
