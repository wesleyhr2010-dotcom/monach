"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(defaultValue);
    const [, startTransition] = useTransition();

    function handleSearch(newValue: string) {
        setValue(newValue);

        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (newValue) {
                params.set("search", newValue);
            } else {
                params.delete("search");
            }
            params.delete("page");
            router.push(`/admin/produtos?${params.toString()}`);
        });
    }

    return (
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Buscar productos..."
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="pl-9"
            />
        </div>
    );
}
