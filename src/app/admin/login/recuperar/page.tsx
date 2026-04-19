import { AdminSplitLayout } from "@/components/admin/auth/AdminSplitLayout";
import { RecoveryForm } from "./recovery-form";

export const metadata = {
  title: "Recuperar Contraseña | Monarca Semijoyas",
  description: "Recibe un enlace para restablecer tu contraseña institucional.",
};

export default function RecuperarPage() {
  return (
    <AdminSplitLayout>
      <RecoveryForm />
    </AdminSplitLayout>
  );
}
