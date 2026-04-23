/**
 * Layout dedicado para /admin/login.
 * Não aplica o AdminLayout (shell com sidebar), apenas renderiza a página filha.
 * O middleware já cuida de redirecionar usuários autenticados para fora desta rota.
 */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
