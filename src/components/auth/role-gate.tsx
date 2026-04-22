import { ReactNode } from "react";
import { getCurrentUser, Role } from "@/lib/user";

interface RoleGateProps {
    children: ReactNode;
    allowedRoles: Role[];
    fallback?: ReactNode;
}

/**
 * A Server Component that conditionally renders its children based on the current user's role.
 * Uses getCurrentUser (non-throwing) since this is a UI gate, not an action guard.
 */
export async function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
    const user = await getCurrentUser();

    if (!user || !user.isActive || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
