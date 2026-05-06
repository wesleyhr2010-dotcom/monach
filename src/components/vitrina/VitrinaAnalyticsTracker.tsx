"use client";

import { useEffect, useRef } from "react";

interface VitrinaAnalyticsTrackerProps {
  resellerId: string;
  tipoEvento: "catalogo_revendedora" | "clique_whatsapp";
  produtoId?: string;
}

export default function VitrinaAnalyticsTracker({
  resellerId,
  tipoEvento,
  produtoId,
}: VitrinaAnalyticsTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch("/api/vitrina/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reseller_id: resellerId,
        tipo_evento: tipoEvento,
        produto_id: produtoId || null,
        page_url: window.location.href,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [resellerId, tipoEvento, produtoId]);

  return null;
}
