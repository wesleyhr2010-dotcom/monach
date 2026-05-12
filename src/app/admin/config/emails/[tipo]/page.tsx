import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getEmailTemplateByTipo } from "../actions";
import { TIPO_EMAIL_OPTIONS } from "@/lib/emails-shared";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import TemplateEditor from "../TemplateEditor";

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
    <>
      <AdminTopHeader
        breadcrumb="Plantillas de Correo"
        backHref="/admin/config/emails"
        title={validTipo.label}
      />
      <div style={{ padding: "28px 32px" }}>
        <div className="admin-card">
          <TemplateEditor template={template} tipo={tipo} />
        </div>
      </div>
    </>
  );
}
