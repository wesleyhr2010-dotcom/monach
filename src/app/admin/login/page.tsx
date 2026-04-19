import { AdminSplitLayout } from "@/components/admin/auth/AdminSplitLayout";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acesso Administrativo | Monarca Semijoyas",
  description: "Ingresa con tus credenciales institucionales para acceder al panel.",
};

export default function LoginPage() {
  return (
    <AdminSplitLayout>
      <LoginForm />
    </AdminSplitLayout>
  );
}
