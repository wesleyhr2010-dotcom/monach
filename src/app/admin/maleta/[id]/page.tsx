"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  getMaletaById,
  devolverMaleta,
  fecharManualmenteMaleta,
  conferirEFecharMaleta,
} from "@/app/admin/actions-maletas";
import type { MaletaDetail } from "@/app/admin/actions-maletas";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { fmtCurrency, daysRemaining, type MaletaStatus } from "@/lib/maleta-helpers";
import {
  Upload, XCircle, Package,
  MessageSquare, Bell, ChevronLeft, Check, AlertTriangle,
} from "lucide-react";

type Tab = "itens" | "acerto" | "historico";

interface MaletaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaletaDetailPage({ params }: MaletaDetailPageProps) {
  const { id } = use(params);

  const [maleta, setMaleta] = useState<MaletaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("itens");

  const [showDevolverDialog, setShowDevolverDialog] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);

  const [showFecharDialog, setShowFecharDialog] = useState(false);
  const [vendidos, setVendidos] = useState<Record<string, number>>({});
  const [fechando, setFechando] = useState(false);
  const [now] = useState(() => Date.now());

  const [showCerrarSinCompDialog, setShowCerrarSinCompDialog] = useState(false);
  const [cerrandoSinComp, setCerrandoSinComp] = useState(false);
  const [notaCierreManual, setNotaCierreManual] = useState("");

  async function loadMaleta() {
    setLoading(true);
    try {
      const data = await getMaletaById(id);
      setMaleta(data);
      if (data) {
        const initial: Record<string, number> = {};
        for (const item of data.itens) {
          initial[item.id] = item.quantidade_vendida;
        }
        setVendidos(initial);
      }
    } catch {
      setError("Error al cargar la consignación.");
    }
    setLoading(false);
  }

  useEffect(() => { loadMaleta(); }, [id]);

  async function handleDevolver() {
    if (!comprovanteUrl.trim()) return;
    setDevolvendo(true);
    setError("");
    const result = await devolverMaleta(id, comprovanteUrl);
    if (result.success) {
      setShowDevolverDialog(false);
      setSuccessMsg("Consignación devuelta exitosamente!");
      loadMaleta();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(result.error || "Error al devolver.");
    }
    setDevolvendo(false);
  }

  async function handleFecharManualmente() {
    setFechando(true);
    setError("");
    const itensVendidos = Object.entries(vendidos).map(
      ([maleta_item_id, quantidade_vendida]) => ({
        maleta_item_id,
        quantidade_vendida,
      })
    );
    const result = await fecharManualmenteMaleta(id, itensVendidos);
    if (result.success) {
      setShowFecharDialog(false);
      setSuccessMsg("Consignación movida a Ag. Conferencia.");
      loadMaleta();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(result.error || "Error al cerrar.");
    }
    setFechando(false);
  }

  async function handleCerrarSinComprobante() {
    if (!maleta) return;
    setCerrandoSinComp(true);
    setError("");

    const itens_conferidos = maleta.itens.map((item) => ({
      item_id: item.id,
      quantidade_recebida: item.quantidade_enviada - item.quantidade_vendida,
    }));

    const result = await conferirEFecharMaleta({
      maleta_id: id,
      itens_conferidos,
      nota_acerto: notaCierreManual || undefined,
      cierre_manual_sin_comprobante: true,
    });

    if (result.success) {
      setShowCerrarSinCompDialog(false);
      setSuccessMsg("Consignación cerrada sin comprobante.");
      loadMaleta();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(result.error || "Error al cerrar sin comprobante.");
    }
    setCerrandoSinComp(false);
  }

  if (loading) {
    return <div className="admin-content"><div className="admin-loading"><div className="admin-spinner" /></div></div>;
  }

  if (!maleta) {
    return (
      <div className="admin-content">
        <div className="admin-empty">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Consignación no encontrada</p>
          <Link href="/admin/maleta"><button className="admin-btn admin-btn-secondary mt-4">← Volver</button></Link>
        </div>
      </div>
    );
  }

  const days = daysRemaining(maleta.data_limite);
  const isActive = maleta.status === "ativa" || maleta.status === "atrasada";
  const isAguardando = maleta.status === "aguardando_revisao";
  const isConcluida = maleta.status === "concluida";
  const isAtrasada = maleta.status === "atrasada";
  const diasEmAberto = Math.abs(Math.ceil((now - new Date(maleta.data_envio).getTime()) / (1000 * 60 * 60 * 24)));

  const pctRevendedora = maleta.reseller.taxa_comissao;
  const pctColab = maleta.reseller.colaboradora?.taxa_comissao ?? 0;

  const totalEnviado = maleta.valor_total_enviado ?? maleta.itens.reduce((s, i) => s + (i.preco_fixado || 0) * i.quantidade_enviada, 0);
  const totalVendido = maleta.valor_total_vendido ?? maleta.itens.reduce((s, i) => s + (i.preco_fixado || 0) * i.quantidade_vendida, 0);
  const totalRetorno = totalEnviado - totalVendido;
  const comRevendedora = maleta.valor_comissao_revendedora ?? (totalVendido * pctRevendedora / 100);
  const comColab = maleta.valor_comissao_colaboradora ?? (totalVendido * pctColab / 100);

  const previewTotal = maleta.itens.reduce((sum, item) => {
    const qty = vendidos[item.id] || 0;
    return sum + (item.preco_fixado || 0) * qty;
  }, 0);

  const totalPecas = maleta.itens.reduce((s, i) => s + i.quantidade_enviada, 0);
  const totalVendidas = maleta.itens.reduce((s, i) => s + i.quantidade_vendida, 0);
  const totalRetornoPecas = totalPecas - totalVendidas;

  const prazoTotal = Math.ceil((new Date(maleta.data_limite).getTime() - new Date(maleta.data_envio).getTime()) / (1000 * 60 * 60 * 24));
  const prazoPerc = days < 0 ? 110 : Math.min(100, Math.round(((prazoTotal - days) / prazoTotal) * 100));

  const initials = maleta.reseller.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  const tabs: { key: Tab; label: string }[] = [
    { key: "itens", label: `Itens (${maleta.itens.length})` },
    { key: "acerto", label: "Acerto" },
    { key: "historico", label: "Histórico" },
  ];

  function getItemStatus(item: MaletaDetail["itens"][number]): { label: string; color: string; bg: string } {
    if (item.quantidade_vendida === item.quantidade_enviada) {
      return { label: "Vendido", color: "#4ADE80", bg: "rgba(74,222,128,0.1)" };
    }
    if (item.quantidade_vendida === 0) {
      return { label: "Disponível", color: "#6677DD", bg: "rgba(100,119,221,0.12)" };
    }
    return { label: "Parcial", color: "#FACC15", bg: "rgba(250,204,21,0.1)" };
  }

  return (
    <div className="admin-content" style={{ gap: 18 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--admin-border)", paddingBottom: 16, marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/maleta" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#171717", border: "1px solid #2A2A2A" }}>
            <ChevronLeft style={{ width: 12, height: 12, color: "#666" }} />
          </Link>
          <div>
            <div style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>
              Admin / Maletas / #{maleta.numero}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Playfair Display', system-ui, serif", color: "#EDEDED", lineHeight: "24px" }}>
              Maleta #{maleta.numero} — {maleta.reseller.name}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AdminStatusBadge status={maleta.status as MaletaStatus} />
          {isActive && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 12, color: isAtrasada ? "#E05C5C" : days <= 3 ? "#FACC15" : "#4ADE80", fontFamily: "Raleway, system-ui, sans-serif" }}>
              {isAtrasada ? `— ${Math.abs(days)} dias` : days <= 0 ? "— Hoy" : `— ${days}d rest.`}
            </span>
          )}
          {maleta.reseller.whatsapp && (
            <a
              href={`https://wa.me/${maleta.reseller.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 9, background: "#0F3D1C", border: "1px solid #1A5A2A", color: "#4ADE80", fontWeight: 600, fontSize: 12, textDecoration: "none", fontFamily: "Raleway, system-ui, sans-serif" }}
            >
              <MessageSquare style={{ width: 14, height: 14 }} />
              Contatar {maleta.reseller.name.split(" ")[0]}
            </a>
          )}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, background: "#1C3A35", border: "1px solid rgba(53,96,90,0.33)" }}>
            <Bell style={{ width: 15, height: 15, color: "#4ADE80" }} />
            {isAguardando && (
              <span style={{ position: "absolute", top: -4, right: -4, display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: "#E05C5C", border: "1.5px solid #0A0A0A", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "Raleway, system-ui, sans-serif" }}>1</span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {successMsg && <div className="admin-alert admin-alert-success">{successMsg}</div>}

      {/* ── 3-Card Row: Revendedora | Prazos | Resumo Financeiro ── */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Card Revendedora */}
        <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", borderRadius: 12, padding: "20px 22px", gap: 14, background: "#171717", border: "1px solid #222222" }}>
          <div style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 11, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>
            Revendedora
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #5a3e2b, #8b6f47)", color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Raleway, system-ui, sans-serif", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#EDEDED", fontFamily: "Raleway, system-ui, sans-serif" }}>{maleta.reseller.name}</div>
              {maleta.reseller.colaboradora && (
                <div style={{ fontSize: 12, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Consultora: {maleta.reseller.colaboradora.name}</div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ textTransform: "uppercase", letterSpacing: "0.5px", fontSize: 11, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Comissão</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#EDEDED", fontFamily: "'Playfair Display', system-ui, serif" }}>{pctRevendedora}%</div>
            </div>
            <div style={{ width: 1, background: "#222" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ textTransform: "uppercase", letterSpacing: "0.5px", fontSize: 11, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Nível</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: maleta.reseller.nivel_cor || "#B4ABA2", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: maleta.reseller.nivel_cor || "#B4ABA2", fontFamily: "Raleway, system-ui, sans-serif" }}>{maleta.reseller.nivel || "—"}</span>
              </div>
            </div>
            <div style={{ width: 1, background: "#222" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ textTransform: "uppercase", letterSpacing: "0.5px", fontSize: 11, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Pontos</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#B4ABA2", fontFamily: "'Playfair Display', system-ui, serif" }}>{maleta.reseller.pontos.toLocaleString("es-PY")} pts</div>
            </div>
          </div>
        </div>

        {/* Card Prazos */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 12, padding: "20px 22px", gap: 14, background: "#171717", border: "1px solid #222222" }}>
          <div style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 11, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>
            Prazos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Início</span>
              <span style={{ fontSize: 13, color: "#BBB", fontFamily: "Raleway, system-ui, sans-serif" }}>{new Date(maleta.data_envio).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Vencimento</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: isAtrasada ? "#E05C5C" : days <= 3 ? "#FACC15" : "#BBB", fontFamily: "Raleway, system-ui, sans-serif" }}>
                {new Date(maleta.data_limite).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div style={{ height: 1, background: "#222" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Dias em aberto</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isAtrasada ? "#E05C5C" : "#EDEDED", fontFamily: "Raleway, system-ui, sans-serif" }}>
                {diasEmAberto} dias
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ height: 5, borderRadius: 3, background: "#222", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(prazoPerc, 100)}%`, height: "100%", borderRadius: 3, background: isAtrasada ? "#E05C5C" : days <= 3 ? "#FACC15" : "#4ADE80" }} />
            </div>
            <div style={{ fontSize: 10, color: isAtrasada ? "#E05C5C" : "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>
              {isAtrasada ? "Prazo expirado" : isConcluida ? "Concluída" : `${days}d restantes`}
            </div>
          </div>
        </div>

        {/* Card Resumo Financeiro */}
        <div style={{ flex: "1.2 1 0%", display: "flex", flexDirection: "column", borderRadius: 12, padding: "20px 22px", gap: 14, background: "#171717", border: "1px solid #222222" }}>
          <div style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 11, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>
            Resumo Financeiro
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "#1E1E1E" }}>
              <span style={{ fontSize: 12, color: "#666", fontFamily: "Raleway, system-ui, sans-serif" }}>Total enviado</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#EDEDED", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(totalEnviado)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 8, padding: "8px 12px", gap: 2, background: "#0F2E1E" }}>
                <span style={{ fontSize: 11, color: "rgba(74,222,128,0.53)", fontFamily: "Raleway, system-ui, sans-serif" }}>Vendido</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#4ADE80", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(totalVendido)}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 8, padding: "8px 12px", gap: 2, background: "#1A1A2E" }}>
                <span style={{ fontSize: 11, color: "rgba(102,119,221,0.53)", fontFamily: "Raleway, system-ui, sans-serif" }}>Retorno</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#6677DD", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(totalRetorno)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 8, padding: "8px 12px", gap: 2, background: "#1A1A1A" }}>
                <span style={{ fontSize: 11, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Com. Revendedora ({pctRevendedora}%)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#B4ABA2", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(comRevendedora)}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 8, padding: "8px 12px", gap: 2, background: "#1A1A1A" }}>
                <span style={{ fontSize: 11, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>Com. Consultora{pctColab > 0 ? ` (${pctColab}%)` : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#917961", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(comColab)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #1A1A1A" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              border: "none", background: "none", cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid #35605A" : "2px solid transparent",
              color: activeTab === tab.key ? "#35605A" : "#555",
              fontFamily: "Raleway, system-ui, sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Itens ── */}
      {activeTab === "itens" && (
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden", background: "#171717", border: "1px solid #222222" }}>
          {/* Table Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 38, background: "#141414", borderBottom: "1px solid #222222" }}>
            <div style={{ width: 48, flexShrink: 0 }} />
            <div style={{ flex: 2 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Produto</span>
            </div>
            <div style={{ width: 110, flexShrink: 0, textAlign: "right" }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Preço Unit.</span>
            </div>
            <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Qtd</span>
            </div>
            <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Vendidos</span>
            </div>
            <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Retorno</span>
            </div>
            <div style={{ width: 110, flexShrink: 0, textAlign: "right" }}>
              <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10, fontWeight: 700, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>Status</span>
            </div>
          </div>

          {/* Table Rows */}
          {maleta.itens.map((item) => {
            const status = getItemStatus(item);
            const retorno = item.quantidade_enviada - item.quantidade_vendida;
            const isFullSold = item.quantidade_vendida === item.quantidade_enviada;
            const sku = item.product_variant.sku;
            const catName = item.product_variant.product.category_name;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", padding: "0 20px", height: 54,
                  borderBottom: "1px solid #1E1E1E",
                  background: isFullSold ? "#121A12" : "transparent",
                }}
              >
                <div style={{ width: 48, flexShrink: 0 }}>
                  {item.product_variant.product.images?.[0] ? (
                    <img src={item.product_variant.product.images[0]} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", border: isFullSold ? "1px solid #2A3A2A" : "1px solid #2A2A2A", background: "#1E1E1E" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: isFullSold ? "#1A2A1A" : "#1E1E1E", border: isFullSold ? "1px solid #2A3A2A" : "1px solid #2A2A2A" }}>
                      <Package style={{ width: 14, height: 14, color: isFullSold ? "#4ADE80" : "#555" }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, color: "#CCC", fontFamily: "Raleway, system-ui, sans-serif" }}>{item.product_variant.product.name}</span>
                  <span style={{ fontSize: 11, color: "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>
                    {sku ? `SKU: ${sku}` : ""}{sku && catName ? " · " : ""}{catName || ""}
                  </span>
                </div>
                <div style={{ width: 110, flexShrink: 0, textAlign: "right" }}>
                  <span style={{ fontSize: 13, color: "#BBB", fontFamily: "'Playfair Display', system-ui, serif" }}>{fmtCurrency(item.preco_fixado)}</span>
                </div>
                <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "#BBB", fontFamily: "Raleway, system-ui, sans-serif" }}>{item.quantidade_enviada}</span>
                </div>
                <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.quantidade_vendida > 0 ? "#4ADE80" : "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>{item.quantidade_vendida}</span>
                </div>
                <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: retorno > 0 ? "#6677DD" : "#444", fontFamily: "Raleway, system-ui, sans-serif" }}>{retorno}</span>
                </div>
                <div style={{ width: 110, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: status.label === "Vendido" ? 4 : 0, padding: "3px 8px", borderRadius: 6, background: status.bg, fontWeight: 700, fontSize: 11, color: status.color, fontFamily: "Raleway, system-ui, sans-serif" }}>
                    {status.label === "Vendido" && <Check style={{ width: 10, height: 10 }} />}
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 20px", borderTop: "1px solid #1E1E1E" }}>
            <span style={{ fontSize: 12, color: "#555", fontFamily: "Raleway, system-ui, sans-serif" }}>
              {totalPecas} peças · {totalVendidas} vendidas · {totalRetornoPecas} retorno
            </span>
          </div>
        </div>
      )}

      {/* ── Tab: Acerto ── */}
      {activeTab === "acerto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {maleta.comprovante_devolucao_url && (
            <div className="admin-card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--admin-text)" }}>Comprobante de Devolución</h3>
              <a href={maleta.comprovante_devolucao_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--admin-accent)" }}>
                Ver imagen adjunta →
              </a>
            </div>
          )}
          {maleta.nota_acerto && (
            <div className="admin-card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--admin-text)" }}>Nota del Acuerdo</h3>
              <p style={{ fontSize: 14, color: "var(--admin-text-muted)" }}>{maleta.nota_acerto}</p>
            </div>
          )}
          {!isConcluida && (
            <div className="admin-alert admin-alert-warning" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}>
              El resumen financiero se congela al cerrar la consignación vía conferencia.
            </div>
          )}
          {isConcluida && (
            <div className="admin-card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--admin-text)" }}>Valores Finales (congelados)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "var(--admin-text-muted)" }}>Total Enviado</span>
                  <span style={{ fontWeight: 600 }}>{fmtCurrency(maleta.valor_total_enviado)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "var(--admin-text-muted)" }}>Total Vendido</span>
                  <span style={{ fontWeight: 600, color: "#4ADE80" }}>{fmtCurrency(maleta.valor_total_vendido)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "var(--admin-text-muted)" }}>Com. Revendedora</span>
                  <span style={{ fontWeight: 600 }}>{fmtCurrency(maleta.valor_comissao_revendedora)}</span>
                </div>
                {maleta.valor_comissao_colaboradora !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--admin-text-muted)" }}>Com. Consultora</span>
                    <span style={{ fontWeight: 600 }}>{fmtCurrency(maleta.valor_comissao_colaboradora)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Histórico ── */}
      {activeTab === "historico" && (
        <div className="admin-card">
          <h3 style={{ fontWeight: 600, marginBottom: 16, color: "var(--admin-text)" }}>Histórico</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginTop: 6, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>Consignación creada</p>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{new Date(maleta.created_at).toLocaleString("es-PY")}</p>
              </div>
            </div>
            {(maleta.status === "aguardando_revisao" || maleta.status === "concluida") && (
              <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", marginTop: 6, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Devolución registrada</p>
                  <p style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>Esperando conferencia del admin</p>
                </div>
              </div>
            )}
            {maleta.status === "concluida" && (
              <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginTop: 6, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Consignación cerrada</p>
                  <p style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{new Date(maleta.updated_at).toLocaleString("es-PY")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer: Warning + Actions ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAtrasada && (
            <>
              <AlertTriangle style={{ width: 14, height: 14, color: "#E05C5C" }} />
              <span style={{ fontSize: 12, color: "#E05C5C", fontFamily: "Raleway, system-ui, sans-serif" }}>
                Maleta atrasada. Entre em contato com a revendedora para regularizar.
              </span>
            </>
          )}
          {isAguardando && (
            <>
              <AlertTriangle style={{ width: 14, height: 14, color: "#FACC15" }} />
              <span style={{ fontSize: 12, color: "#FACC15", fontFamily: "Raleway, system-ui, sans-serif" }}>
                Aguardando conferencia del recebimento.
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isActive && (
            <>
              <button
                onClick={() => setShowFecharDialog(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 38, borderRadius: 9, background: "#171717", border: "1px solid #2A2A2A", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "Raleway, system-ui, sans-serif" }}
              >
                <XCircle style={{ width: 13, height: 13 }} />
                Fechar Manualmente
              </button>
              <button
                onClick={() => setShowDevolverDialog(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 38, borderRadius: 9, background: "#35605A", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Raleway, system-ui, sans-serif" }}
              >
                <Upload style={{ width: 13, height: 13 }} />
                Registrar Acerto
              </button>
            </>
          )}
          {isAguardando && (
            <>
              <Link href={`/admin/maleta/${id}/conferir`}>
                <button
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 38, borderRadius: 9, background: "#35605A", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Raleway, system-ui, sans-serif" }}
                >
                  <Check style={{ width: 13, height: 13 }} />
                  Conferir Consignación
                </button>
              </Link>
              {!maleta.comprovante_devolucao_url && (
                <button
                  onClick={() => setShowCerrarSinCompDialog(true)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 38, borderRadius: 9, background: "#171717", border: "1px solid #E05C5C", color: "#E05C5C", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Raleway, system-ui, sans-serif" }}
                >
                  <XCircle style={{ width: 13, height: 13 }} />
                  Cerrar sin Comprobante
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Dialog: Devolver ── */}
      {showDevolverDialog && (
        <div className="admin-dialog-overlay" onClick={() => setShowDevolverDialog(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "var(--admin-text)" }}><Upload className="w-5 h-5 inline mr-2" />Devolver Consignación</h3>
            <p style={{ color: "var(--admin-text-muted)" }}>Pega el link del comprobante de devolución.</p>
            <div className="admin-form-group">
              <label className="admin-label">URL del Comprobante</label>
              <input className="admin-input" placeholder="https://..." value={comprovanteUrl} onChange={(e) => setComprovanteUrl(e.target.value)} />
            </div>
            <div className="admin-dialog-actions">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDevolverDialog(false)}>Cancelar</button>
              <button className="admin-btn admin-btn-primary" onClick={handleDevolver} disabled={devolvendo || !comprovanteUrl.trim()}>
                {devolvendo ? "Enviando..." : "Confirmar Devolución"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Fechar Manualmente ── */}
      {showFecharDialog && (
        <div className="admin-dialog-overlay" onClick={() => setShowFecharDialog(false)}>
          <div className="admin-dialog" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "var(--admin-text)" }}><XCircle className="w-5 h-5 inline mr-2" />Cerrar Manualmente</h3>
            <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginBottom: 16 }}>
              Informe las cantidades vendidas. La consignación pasará a Ag. Conferencia.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: "right" }}>Enviado</th>
                    <th style={{ textAlign: "right" }}>Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {maleta.itens.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontSize: 14 }}>{item.product_variant.product.name} ({item.product_variant.attribute_value})</td>
                      <td style={{ fontSize: 14, textAlign: "right" }}>{item.quantidade_enviada}</td>
                      <td style={{ textAlign: "right" }}>
                        <input
                          type="number" min={0} max={item.quantidade_enviada}
                          value={vendidos[item.id] ?? 0}
                          onChange={(e) => {
                            const val = Math.min(item.quantidade_enviada, Math.max(0, parseInt(e.target.value) || 0));
                            setVendidos((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          className="admin-input" style={{ width: 80, textAlign: "right" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, marginTop: 16 }}>
              Total vendido estimado: <span style={{ color: "#4ade80" }}>{fmtCurrency(previewTotal)}</span>
            </p>
            <div className="admin-dialog-actions">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowFecharDialog(false)}>Cancelar</button>
              <button className="admin-btn admin-btn-primary" onClick={handleFecharManualmente} disabled={fechando}>
                {fechando ? "Cerrando..." : "Confirmar Cierre Manual"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Cerrar sin Comprobante ── */}
      {showCerrarSinCompDialog && (
        <div className="admin-dialog-overlay" onClick={() => setShowCerrarSinCompDialog(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "var(--admin-text)" }}><XCircle className="w-5 h-5 inline mr-2" />Cerrar sin Comprobante</h3>
            <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginBottom: 16 }}>
              Vas a cerrar esta consignación sin comprobante de devolución. Se asumirá que todos los artículos no vendidos fueron recibidos.
            </p>
            <div className="admin-form-group">
              <label className="admin-label">Justificación (opcional)</label>
              <input
                className="admin-input"
                placeholder="Ej: Entrega presencial sin foto"
                value={notaCierreManual}
                onChange={(e) => setNotaCierreManual(e.target.value)}
              />
            </div>
            <div className="admin-dialog-actions">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowCerrarSinCompDialog(false)}>Cancelar</button>
              <button className="admin-btn admin-btn-primary" onClick={handleCerrarSinComprobante} disabled={cerrandoSinComp}>
                {cerrandoSinComp ? "Cerrando..." : "Confirmar Cierre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
