"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Landmark } from "lucide-react";
import { getPerfilCompleto, guardarDatosBancarios } from "../actions";

type Tab = "alias" | "cuenta_bancaria";

export default function DatosBancariosPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [tab, setTab] = useState<Tab>("alias");

    const [aliasForm, setAliasForm] = useState({
        alias_tipo: "CI" as "CI" | "RUC" | "Celular" | "Email",
        alias_valor: "",
        alias_titular: "",
        alias_ci_ruc: "",
    });

    const [cuentaForm, setCuentaForm] = useState({
        banco: "",
        agencia: "",
        cuenta: "",
        tipo_cuenta: "ahorro" as "corriente" | "ahorro",
        titular: "",
        ci_ruc: "",
    });

    useEffect(() => {
        getPerfilCompleto()
            .then((p) => {
                if (p.dados_bancarios) {
                    const db = p.dados_bancarios;
                    if (db.tipo === "alias") {
                        setTab("alias");
                        setAliasForm({
                            alias_tipo: (db.alias_tipo as any) || "CI",
                            alias_valor: db.alias_valor || "",
                            alias_titular: db.alias_titular || "",
                            alias_ci_ruc: db.alias_ci_ruc || "",
                        });
                    } else {
                        setTab("cuenta_bancaria");
                        setCuentaForm({
                            banco: db.banco || "",
                            agencia: db.agencia || "",
                            cuenta: db.cuenta || "",
                            tipo_cuenta: (db.tipo_cuenta as any) || "ahorro",
                            titular: db.titular || "",
                            ci_ruc: db.ci_ruc || "",
                        });
                    }
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Error al cargar datos.");
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const data =
                tab === "alias"
                    ? { tipo: "alias" as const, ...aliasForm }
                    : { tipo: "cuenta_bancaria" as const, ...cuentaForm };
            await guardarDatosBancarios(data);
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F2EF] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "#EBEBEB", borderTopColor: "#35605A" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F2EF]">
            <div className="bg-white px-4 py-4 flex items-center gap-3 border-b border-[#E8E2D6] sticky top-0 z-10">
                <button onClick={() => router.push("/app/perfil")} className="p-1 -ml-1">
                    <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <h1 className="text-base font-bold text-[#1A1A1A]">Datos Bancarios</h1>
            </div>

            <div className="px-4 py-5 max-w-lg mx-auto">
                <div className="flex items-center gap-2 mb-4 text-[#6b7280]">
                    <Landmark className="w-4 h-4" />
                    <p className="text-xs">Usados solo para comisiones</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 mb-4 border border-[#E8E2D6]">
                    <button
                        onClick={() => setTab("alias")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                            tab === "alias" ? "bg-[#2E5A4C] text-white" : "text-[#6b7280] hover:bg-[#F5F0E8]"
                        }`}
                    >
                        Alias
                    </button>
                    <button
                        onClick={() => setTab("cuenta_bancaria")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                            tab === "cuenta_bancaria" ? "bg-[#2E5A4C] text-white" : "text-[#6b7280] hover:bg-[#F5F0E8]"
                        }`}
                    >
                        Cuenta Bancaria
                    </button>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
                {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3 mb-4">¡Datos guardados!</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {tab === "alias" ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-[#4b5563] mb-1.5 block">Tipo de Alias</label>
                                <select
                                    value={aliasForm.alias_tipo}
                                    onChange={(e) => setAliasForm({ ...aliasForm, alias_tipo: e.target.value as any })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E8E2D6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5A4C]/20"
                                >
                                    <option value="CI">CI (Cédula de Identidad)</option>
                                    <option value="RUC">RUC</option>
                                    <option value="Celular">Celular</option>
                                    <option value="Email">Email</option>
                                </select>
                            </div>
                            <Field label="Alias" value={aliasForm.alias_valor} onChange={(v) => setAliasForm({ ...aliasForm, alias_valor: v })} required />
                            <Field label="Nombre del Titular" value={aliasForm.alias_titular} onChange={(v) => setAliasForm({ ...aliasForm, alias_titular: v })} required />
                            <Field label="CI/RUC" value={aliasForm.alias_ci_ruc} onChange={(v) => setAliasForm({ ...aliasForm, alias_ci_ruc: v })} required />
                        </>
                    ) : (
                        <>
                            <Field label="Banco" value={cuentaForm.banco} onChange={(v) => setCuentaForm({ ...cuentaForm, banco: v })} required />
                            <Field label="Sucursal / Agencia" value={cuentaForm.agencia} onChange={(v) => setCuentaForm({ ...cuentaForm, agencia: v })} />
                            <Field label="Cuenta" value={cuentaForm.cuenta} onChange={(v) => setCuentaForm({ ...cuentaForm, cuenta: v })} required />
                            <div>
                                <label className="text-sm font-medium text-[#4b5563] mb-1.5 block">Tipo de Cuenta</label>
                                <select
                                    value={cuentaForm.tipo_cuenta}
                                    onChange={(e) => setCuentaForm({ ...cuentaForm, tipo_cuenta: e.target.value as any })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E8E2D6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5A4C]/20"
                                >
                                    <option value="ahorro">Ahorro</option>
                                    <option value="corriente">Corriente</option>
                                </select>
                            </div>
                            <Field label="Titular" value={cuentaForm.titular} onChange={(v) => setCuentaForm({ ...cuentaForm, titular: v })} required />
                            <Field label="CI/RUC" value={cuentaForm.ci_ruc} onChange={(v) => setCuentaForm({ ...cuentaForm, ci_ruc: v })} required />
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Guardando..." : "Guardar Datos Bancarios"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
    return (
        <div>
            <label className="text-sm font-medium text-[#4b5563] mb-1.5 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2D6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5A4C]/20"
            />
        </div>
    );
}
