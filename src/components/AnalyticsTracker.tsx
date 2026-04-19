"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
    tipoEvento: string;
    pageUrl: string;
    resellerId?: string;
}

export default function AnalyticsTracker({ tipoEvento, pageUrl, resellerId }: AnalyticsTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo_evento: tipoEvento,
                page_url: pageUrl,
                reseller_id: resellerId || null,
            }),
        }).catch(() => {
            // Silently fail — analytics should never break the page
        });
    }, [tipoEvento, pageUrl, resellerId]);

    return null;
}
