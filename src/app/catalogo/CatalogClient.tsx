"use client";

import { useEffect } from "react";
import { setCartContext } from "@/lib/cart";
import Header from "@/components/Header";

export default function CatalogClient() {
    useEffect(() => {
        // Clear reseller context so checkout uses the main store's WhatsApp
        setCartContext(null);
    }, []);

    return <Header variant="dark" />;
}
