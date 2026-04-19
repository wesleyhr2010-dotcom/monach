"use client";

import { useState, useEffect } from "react";
import { getPerfilRevendedora } from "./actions";
import { logoutApp } from "@/lib/actions/auth";
import { User, Mail, Phone, Calendar, Award, Star, LogOut, ChevronRight } from "lucide-react";

type PerfilData = Awaited<ReturnType<typeof getPerfilRevendedora>>;

function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function PerfilPage() {
    const [data, setData] = useState<PerfilData | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPerfilRevendedora()
            .then((result) => {
                setData(result);
                setLoading(false);
            })
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : "Erro ao carregar perfil.";
                setError(message);
                setLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-gray-500 text-sm">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-5 py-6 max-w-lg mx-auto w-full">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="bg-[#0d8282] text-white px-3 py-1 rounded-full text-xs font-medium">
                        Nível {data.nivel}
                    </div>
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {data.xpTotal} pts
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 mb-8">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Informações</h2>

                <div className="bg-[#f9fafa] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">E-mail</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{data.email || "Não informado"}</p>
                    </div>
                </div>

                <div className="bg-[#f9fafa] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">WhatsApp</p>
                        <p className="text-sm font-medium text-gray-900">{data.whatsapp || "Não informado"}</p>
                    </div>
                </div>

                <div className="bg-[#f9fafa] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">Membro desde</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                    </div>
                </div>

                <div className="bg-[#f9fafa] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <Award className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500">Comissão</p>
                        <p className="text-sm font-medium text-gray-900">{data.comissaoPct}%</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Resumo</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#f9fafa] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">{data.totalMaletas}</span>
                        <span className="text-[11px] text-gray-500 mt-1">Maletas</span>
                    </div>
                    <div className="bg-[#f9fafa] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">{data.totalVendas}</span>
                        <span className="text-[11px] text-gray-500 mt-1">Vendas</span>
                    </div>
                    <div className="bg-[#f9fafa] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">{data.totalPecas}</span>
                        <span className="text-[11px] text-gray-500 mt-1">Peças</span>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <form action={logoutApp}>
                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-500 bg-red-50 p-3.5 rounded-xl hover:bg-red-100 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sair do Aplicativo
                </button>
            </form>
        </div>
    );
}
