import { fixVariantAttributes } from "@/lib/actions/fix-variant-attributes";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AlertTriangle, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FixVariantAttributesPage() {
  const result = await fixVariantAttributes();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AdminTopHeader
        breadcrumb="Admin / Correção"
        title="Corrigir Atributos de Variantes"
      />

      <div className="admin-page-body" style={{ maxWidth: 600 }}>
        <div
          style={{
            background: result.success
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${result.success ? "#22c55e" : "#ef4444"}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {result.success ? (
            <CheckCircle size={48} color="#22c55e" />
          ) : (
            <AlertTriangle size={48} color="#ef4444" />
          )}

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              color: result.success ? "#16a34a" : "#dc2626",
              margin: 0,
            }}
          >
            {result.success ? "Correção Aplicada" : "Erro na Correção"}
          </h2>

          <p
            style={{
              fontFamily: "Raleway, sans-serif",
              fontSize: 14,
              color: "var(--admin-text)",
              margin: 0,
            }}
          >
            {result.message}
          </p>

          {result.updated > 0 && (
            <div
              style={{
                background: "var(--admin-surface)",
                borderRadius: 8,
                padding: "12px 16px",
                width: "100%",
              }}
            >
              <p
                style={{
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 13,
                  color: "var(--admin-text-muted)",
                  margin: "0 0 4px 0",
                }}
              >
                Variantes corrigidas
              </p>
              <p
                style={{
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--admin-text)",
                  margin: 0,
                }}
              >
                {result.updated}
              </p>
            </div>
          )}

          {result.remainingPadrao !== undefined && result.remainingPadrao > 0 && (
            <p
              style={{
                fontFamily: "Raleway, sans-serif",
                fontSize: 12,
                color: "#f59e0b",
                margin: 0,
              }}
            >
              ⚠️ Ainda restam {result.remainingPadrao} registros com 'Padrão/Único'
            </p>
          )}

          {result.remainingPadrao === 0 && result.updated > 0 && (
            <p
              style={{
                fontFamily: "Raleway, sans-serif",
                fontSize: 12,
                color: "#22c55e",
                margin: 0,
              }}
            >
              ✅ Todos os registros estão padronizados para 'Tipo/Único'
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "var(--admin-surface)",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 12,
            color: "var(--admin-text-muted)",
          }}
        >
          <strong>Migration registrada:</strong>
          <br />
          20260512000000_fix_variant_padrao_to_tipo
          <br />
          <br />
          <em>
            Após confirmar que tudo está correto, delete esta página e a server
            action.
          </em>
        </div>
      </div>
    </div>
  );
}
