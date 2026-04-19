"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMaletas, checkOverdueMaletas } from "@/app/admin/actions-maletas";
import type { MaletaListItem } from "@/app/admin/actions-maletas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Clock, AlertTriangle, CheckCircle, Eye } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ativa: { label: "Ativa", color: "bg-emerald-100 text-emerald-700", icon: <Briefcase className="w-3 h-3" /> },
    atrasada: { label: "Atrasada", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-3 h-3" /> },
    aguardando_revisao: { label: "Aguardando Revisão", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
    concluida: { label: "Concluída", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3 h-3" /> },
};

function daysRemaining(dataLimite: string): number {
    const now = new Date();
    const limit = new Date(dataLimite);
    return Math.ceil((limit.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MaletasPage() {
    const [maletas, setMaletas] = useState<MaletaListItem[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    async function loadMaletas() {
        setLoading(true);
        try {
            await checkOverdueMaletas();
            const data = await getMaletas(
                undefined,
                statusFilter === "all" ? undefined : statusFilter
            );
            setMaletas(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadMaletas();
    }, [statusFilter]);

    const activaCount = maletas.filter((m) => m.status === "ativa").length;
    const atrasadaCount = maletas.filter((m) => m.status === "atrasada").length;
    const aguardandoCount = maletas.filter((m) => m.status === "aguardando_revisao").length;
    const concluidaCount = maletas.filter((m) => m.status === "concluida").length;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Maletas</h1>
                    <p className="text-sm text-muted-foreground">Controle de consignações para revendedoras</p>
                </div>
                <Link href="/admin/maleta/nova">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Maleta
                    </Button>
                </Link>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("ativa")}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <Briefcase className="w-5 h-5" />
                            <span className="text-2xl font-bold">{activaCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ativas</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("atrasada")}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-2xl font-bold">{atrasadaCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Atrasadas</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("aguardando_revisao")}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-2xl font-bold">{aguardandoCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Revisão</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("concluida")}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-blue-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-2xl font-bold">{concluidaCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativa">Ativas</SelectItem>
                        <SelectItem value="atrasada">Atrasadas</SelectItem>
                        <SelectItem value="aguardando_revisao">Aguardando Revisão</SelectItem>
                        <SelectItem value="concluida">Concluídas</SelectItem>
                    </SelectContent>
                </Select>
                {statusFilter !== "all" && (
                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
                        Limpar filtro
                    </Button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Carregando maletas...
                    </CardContent>
                </Card>
            ) : maletas.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Nenhuma maleta encontrada</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Crie a primeira maleta para uma revendedora.
                        </p>
                        <Link href="/admin/maleta/nova">
                            <Button className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Maleta
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Revendedora</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Itens</TableHead>
                                <TableHead>Prazo</TableHead>
                                <TableHead>Enviada em</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {maletas.map((m) => {
                                const days = daysRemaining(m.data_limite);
                                const sc = statusConfig[m.status];
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {m.reseller.avatar_url ? (
                                                    <img
                                                        src={m.reseller.avatar_url}
                                                        alt={m.reseller.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                                        👤
                                                    </div>
                                                )}
                                                <span className="font-medium text-sm">{m.reseller.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${sc.color} gap-1`} variant="secondary">
                                                {sc.icon}
                                                {sc.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{m._count.itens} peças</span>
                                        </TableCell>
                                        <TableCell>
                                            {m.status === "ativa" || m.status === "atrasada" ? (
                                                <span className={`text-sm font-medium ${days < 0 ? "text-red-600" : days <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {days < 0 ? `${Math.abs(days)}d atrasada` : `${days}d restantes`}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(m.data_limite).toLocaleDateString("pt-BR")}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(m.data_envio).toLocaleDateString("pt-BR")}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/maleta/${m.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
