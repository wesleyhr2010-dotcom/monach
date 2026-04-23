"use client";

import { useEffect, useState } from "react";
import { getSolicitacoesPendentesCount } from "@/app/admin/brindes/actions";

export function BrindesBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        getSolicitacoesPendentesCount().then(setCount).catch(() => setCount(0));
    }, []);

    if (count === 0) return null;

    return (
        <span style={{
            background: "#8B1C1C",
            color: "#fff",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Raleway, sans-serif",
            fontWeight: 700,
            fontSize: 9,
            flexShrink: 0,
        }}>
            {count > 9 ? "9+" : count}
        </span>
    );
}
