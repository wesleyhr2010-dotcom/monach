import { getCategories } from "../actions-categories";
import { CategoryManager } from "./CategoryManager";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Categorías — Monarca Admin",
};

export default async function CategoriasPage() {
    const categories = await getCategories();

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <AdminTopHeader
                breadcrumb="Admin / Categorías"
                title="Categorías"
            />
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
                <CategoryManager categories={categories} />
            </div>
        </div>
    );
}
