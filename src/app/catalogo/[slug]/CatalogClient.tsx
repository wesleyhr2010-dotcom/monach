"use client";

import { useEffect } from "react";
import { setCartContext } from "@/lib/cart";
import Header from "@/components/Header";

interface CatalogClientProps {
    resellerSlug: string;
    resellerWhatsapp: string;
    resellerName: string;
}

export default function CatalogClient({
    resellerSlug,
    resellerWhatsapp,
    resellerName,
}: CatalogClientProps) {
    useEffect(() => {
        // Set reseller context so the cart/checkout uses the reseller's WhatsApp
        setCartContext({
            resellerSlug,
            resellerWhatsapp,
            resellerName,
        });
    }, [resellerSlug, resellerWhatsapp, resellerName]);

    return <Header variant="dark" />;
}
