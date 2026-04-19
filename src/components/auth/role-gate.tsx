import { ReactNode } from "react";
import { requireAuth, Role } from "@/lib/user";

interface RoleGateProps {
    children: ReactNode;
    allowedRoles: Role[];
    fallback?: ReactNode; // What to show if the user doesn't have the role (defaults to null)
}

/**
 * A Server Component that conditionally renders its children based on the current user's role.
 * Useful for hiding UI elements (like a "Delete User" button) from lower-tier roles.
 */
export async function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
    const user = await requireAuth();

    // If no user, or user's role isn't in the allowed lists, show fallback
    if (!user || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
