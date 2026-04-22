import { getCategories } from "../actions-categories";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Categorías — Monarca Admin",
};

export default async function CategoriasPage() {
    const categories = await getCategories();

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
            </header>
            <div className="flex flex-col gap-4">
                <CategoryManager categories={categories} />
            </div>
        </div>
    );
}
