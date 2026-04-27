"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { AppPageHeader, SummaryCard, AlertBanner, BottomAction } from "@/components/app/AppPageShell";
import { MaletaItem } from "@/components/app/MaletaItemRow";
import { compressImage } from "@/lib/compress-image";
import { submitDevolucao } from "@/app/app/actions-revendedora";

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

function formatDate(d: Date): string {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type MaletaSummary = {
  id: string;
  numero: number;
  status: string;
  data_limite: Date | null;
  comprovante_devolucao_url: string | null;
};

type Totais = {
  totalEnviados: number;
  totalVendidos: number;
  totalADevolver: number;
  totalVendidoValor: number;
  comissaoPct: number;
  comissaoValor: number;
};

interface DevolverClientProps {
  maleta: MaletaSummary;
  itens: MaletaItem[];
  totais: Totais;
  isOverdue: boolean;
  diasRestantes: number | null;
  isReadOnly: boolean;
}

async function uploadFile(file: File, key: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  const res = await fetch("/api/upload-r2", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Error al subir archivo");
  }

  const { url } = await res.json();
  return url;
}

export default function DevolverClient({
  maleta,
  itens,
  totais,
  isOverdue,
  diasRestantes,
  isReadOnly,
}: DevolverClientProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(isReadOnly ? 4 : 1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la foto";
      setError(msg);
    }
  }, []);

  const handleSubmit = async () => {
    if (!photoFile) {
      setError("Debes adjuntar una foto del comprobante.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const key = `comprovantes/${maleta.id}/${Date.now()}.jpg`;
      const comprovanteUrl = await uploadFile(photoFile, key);

      const result = await submitDevolucao({
        maleta_id: maleta.id,
        comprovante_url: comprovanteUrl,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Error al enviar devolución");
      }

      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar devolución";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Paso 4 (read-only o sucesso) ──
  if (step === 4 || isReadOnly) {
    return (
      <div className="flex flex-col min-h-full bg-[#F5F2EF] relative px-5 pt-6 pb-10">
        <AppPageHeader
          title={isReadOnly ? "Estado de Devolución" : "¡Devolución Enviada!"}
          backHref={`/app/maleta/${maleta.id}`}
          backPattern="modal-close"
        />

        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center mt-8">
          <div
            className="flex items-center justify-center rounded-full w-20 h-20"
            style={{ backgroundColor: isReadOnly ? "#FFF4E5" : "#E2F2E9" }}
          >
            {isReadOnly ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B26A00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1F7A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span
              className="text-[#1A1A1A] text-xl leading-6"
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
            >
              {isReadOnly ? "Esperando Recepción ⏳" : "¡Devolución Enviada!"}
            </span>
            <span
              className="text-[#777777] font-medium text-sm leading-[18px] max-w-[280px]"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              {isReadOnly
                ? "Tu consultora fue notificada. Entrega los artículos en persona o coordina la logística."
                : "Tu consultora fue notificada. Entrega los artículos en persona o coordina la logística."}
            </span>
            <span
              className="text-[#777777] font-medium text-sm leading-[18px] max-w-[280px]"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Cuando ella confirme la recepción recibirás una notificación y la consignación será cerrada.
            </span>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Link
            href="/app"
            className="flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-[#35605A] shadow-[0_4px_12px_rgba(53,96,90,0.2)] text-white font-bold text-sm tracking-[0.5px] uppercase"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Seguir en Inicio →
          </Link>
        </div>
      </div>
    );
  }

  // ── Paso 1: Resumen ──
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-full bg-[#F5F2EF] relative">
        <AppPageHeader
          title={`Devolver Consig. #${maleta.numero}`}
          subtitle={maleta.data_limite ? `Vencimiento: ${formatDate(new Date(maleta.data_limite))}` : undefined}
          backHref={`/app/maleta/${maleta.id}`}
          backPattern="modal-close"
        />

        <div className="flex flex-col px-5 gap-5 pb-[120px]">
          {isOverdue && (
            <AlertBanner
              variant="warning"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B26A00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            >
              Atrasada —{" "}
              {diasRestantes !== null && Math.abs(diasRestantes) > 0
                ? `${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? "s" : ""}`
                : "Hoy vence"}
            </AlertBanner>
          )}

          <SummaryCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            }
            label="Resumen"
            value={`${totais.totalEnviados} artículos`}
          />

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
            <div className="flex justify-between items-center">
              <span className="text-[#777777] font-medium text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                Enviados
              </span>
              <span className="text-[#1A1A1A] font-semibold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                {totais.totalEnviados}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#777777] font-medium text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                Vendidos
              </span>
              <span className="text-[#1A1A1A] font-semibold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                {totais.totalVendidos}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#777777] font-medium text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                A devolver
              </span>
              <span className="text-[#1A1A1A] font-semibold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                {totais.totalADevolver}
              </span>
            </div>
          </div>

          <AlertBanner
            variant="info"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            }
          >
            Al confirmar, enviarás un comprobante de devolución. La consignación solo se cerrará cuando tu consultora confirme el recibo físico.
          </AlertBanner>
        </div>

        <BottomAction>
          <button
            onClick={() => setStep(2)}
            className="flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-[#35605A] shadow-[0_4px_12px_rgba(53,96,90,0.2)] w-full text-white font-bold text-sm tracking-[0.5px] uppercase border-none cursor-pointer"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Continuar →
          </button>
        </BottomAction>
      </div>
    );
  }

  // ── Paso 2: Foto del Comprobante ──
  if (step === 2) {
    return (
      <div className="flex flex-col min-h-full bg-[#F5F2EF] relative">
        <AppPageHeader
          title="Foto del Comprobante"
          backHref={`/app/maleta/${maleta.id}`}
          backPattern="modal-close"
        />

        <div className="flex flex-col px-5 gap-5 pb-[120px]">
          <p
            className="text-[#777777] font-medium text-sm leading-[18px]"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Fotografía los artículos que devolverás, ordenados y visibles.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCapture(file);
            }}
          />

          {!photoPreview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D9D6D2] bg-white p-8 cursor-pointer"
            >
              <div className="flex items-center justify-center rounded-full bg-[#EBEBEB] w-16 h-16">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span
                className="text-[#1A1A1A] font-bold text-sm tracking-[0.5px] uppercase"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Tomar Foto
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden bg-white border border-[#D9D6D2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Comprobante preview"
                  className="w-full h-auto object-cover"
                />
              </div>

              <button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="flex items-center justify-center gap-2 text-[#777777] font-semibold text-sm py-3 bg-transparent border-none cursor-pointer"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                </svg>
                Tomar Otra Foto
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 text-red-600 p-3 text-sm font-medium" style={{ fontFamily: "var(--font-raleway)" }}>
              {error}
            </div>
          )}
        </div>

        <BottomAction>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-white border border-[#D9D6D2] text-[#1A1A1A] font-bold text-sm tracking-[0.5px] uppercase cursor-pointer"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              ← Atrás
            </button>
            <button
              onClick={() => {
                if (!photoPreview) {
                  setError("Debes tomar una foto del comprobante.");
                  return;
                }
                setError(null);
                setStep(3);
              }}
              className="flex-[2] flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-[#35605A] shadow-[0_4px_12px_rgba(53,96,90,0.2)] text-white font-bold text-sm tracking-[0.5px] uppercase border-none cursor-pointer"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Siguiente: Revisar →
            </button>
          </div>
        </BottomAction>
      </div>
    );
  }

  // ── Paso 3: Revisión Final ──
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF] relative">
      <AppPageHeader
        title="Revisión Final"
        backHref={`/app/maleta/${maleta.id}`}
        backPattern="modal-close"
      />

      <div className="flex flex-col px-5 gap-5 pb-[140px]">
        <span
          className="text-[#1A1A1A] text-lg leading-[22px]"
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
        >
          Consignación #{maleta.numero}
        </span>

        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
          <div className="flex justify-between items-center">
            <span className="text-[#777777] font-medium text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              Vendidos ({totais.totalVendidos} artículos)
            </span>
            <span className="text-[#1A1A1A] font-semibold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              {formatCurrency(totais.totalVendidoValor)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#777777] font-medium text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              Devolución ({totais.totalADevolver} artículos)
            </span>
            <span className="text-[#1A1A1A] font-semibold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              {formatCurrency(
                itens.reduce(
                  (s, i) => s + i.precoFixado * (i.quantidadeEnviada - i.quantidadeVendida),
                  0
                )
              )}
            </span>
          </div>
          <div className="h-px bg-[#EBEBEB]" />
          <div className="flex justify-between items-center">
            <span className="text-[#1A1A1A] font-bold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              Comisión estimada ({totais.comissaoPct}%)
            </span>
            <span className="text-[#35605A] font-bold text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              {formatCurrency(totais.comissaoValor)}
            </span>
          </div>
        </div>

        {photoPreview && (
          <div className="flex flex-col gap-2">
            <span
              className="text-[#1A1A1A] font-bold text-sm tracking-[0.5px] uppercase"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              📸 Comprobante
            </span>
            <div className="rounded-2xl overflow-hidden bg-white border border-[#D9D6D2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Comprobante preview"
                className="w-full h-auto object-cover max-h-[200px]"
              />
            </div>
          </div>
        )}

        <AlertBanner
          variant="info"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          }
        >
          Tras el envío, la consignación quedará &quot;Esperando Confirmación&quot; hasta que tu consultora confirme la recepción física.
        </AlertBanner>

        {error && (
          <div className="rounded-xl bg-red-50 text-red-600 p-3 text-sm font-medium" style={{ fontFamily: "var(--font-raleway)" }}>
            {error}
          </div>
        )}
      </div>

      <BottomAction>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-white border border-[#D9D6D2] text-[#1A1A1A] font-bold text-sm tracking-[0.5px] uppercase cursor-pointer"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            ← Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-[#35605A] shadow-[0_4px_12px_rgba(53,96,90,0.2)] text-white font-bold text-sm tracking-[0.5px] uppercase border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {isSubmitting ? "Enviando..." : "✅ Enviar Devolución"}
          </button>
        </div>
      </BottomAction>
    </div>
  );
}
