"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function CategoryFilter({ categories, current }: { categories: string[]; current: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams?.toString() ?? "");

        if (value && value !== "all_categories") {
            params.set("category", value);
        } else {
            params.delete("category");
        }
        params.delete("page"); // Reset to page 1
        router.push(`/admin/produtos?${params.toString()}`);
    }

    return (
        <Select value={current || "all_categories"} onValueChange={handleChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all_categories">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                        {cat}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
