"use client";

import { useEffect, useRef, useState } from "react";
import OneSignal from "react-onesignal";
import { createBrowserClient } from "@supabase/ssr";

export default function OneSignalWrapper() {
    const initialized = useRef(false);
    const isDev = process.env.NODE_ENV === "development";
    const [debugMsg, setDebugMsg] = useState<string | null>(null);

    const showLog = (msg: string) => {
        if (!isDev) return;
        setDebugMsg((prev) => (prev ? `${prev}\n${msg}` : msg));
    };

    useEffect(() => {


        if (initialized.current) return;

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) {
            showLog("❌ NEXT_PUBLIC_ONESIGNAL_APP_ID ausente!");
            return;
        }
        showLog(`AppID: ${appId.substring(0, 8)}...`);

        // Detectar modo standalone (PWA instalado)
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (navigator as any).standalone === true;

        if (!isStandalone) {
            showLog("⚠️ Modo browser — OneSignal só funciona na PWA instalada.");
            return;
        }

        const initOneSignal = async () => {
            try {
                showLog("[1] Iniciando OneSignal.init...");

                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                    serviceWorkerParam: { scope: "/" },
                    serviceWorkerPath: "/OneSignalSDKWorker.js",
                });

                showLog("[2] ✅ Init OK.");
                initialized.current = true;

                // ─── Vincular device ao usuário Supabase ANTES do prompt ───
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const loginUser = async (userId: string) => {
                    showLog(`[3] Login OneSignal: ${userId.substring(0, 12)}...`);
                    await OneSignal.login(userId);
                    showLog("[3b] ✅ Login OK! external_id vinculado.");
                };

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user?.id) {
                    await loginUser(session.user.id);
                } else {
                    showLog("[?] Sessão não encontrada. Aguardando...");
                    supabase.auth.onAuthStateChange(async (_event: any, currentSession: any) => {
                        if (currentSession?.user?.id) {
                            await loginUser(currentSession.user.id);
                        }
                    });
                }

                // ─── Pedir permissão de push (nativo do iOS, sem banner) ───
                showLog("[4] Pedindo permissão nativa...");
                const permission = await OneSignal.Notifications.requestPermission();
                showLog(`[4b] ✅ Permissão: ${permission}`);

                // Checar se está inscrito
                const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
                const pushId = await OneSignal.User.PushSubscription.id;
                showLog(`[5] Push ativo: ${isPushEnabled} | ID: ${pushId?.substring(0, 12) || 'null'}...`);

                if (!permission && !isPushEnabled) {
                    showLog("⚠️ Push negado. Vá em Ajustes → Notificações → Monarca e ative.");
                }
            } catch (err: any) {
                console.error("[OneSignal] Erro:", err);
                showLog(`❌ ERRO: ${err?.message || String(err)}`);
            }
        };

        showLog("🟢 PWA Standalone. Iniciando...");
        initOneSignal();
    }, []);

    if (isDev && debugMsg) {
        return (
            <div className="fixed bottom-24 left-4 right-4 bg-black/90 text-green-400 p-4 rounded-xl z-[9999] text-[10px] font-mono whitespace-pre-wrap pointer-events-none break-all max-h-[40vh] overflow-auto">
                {debugMsg}
            </div>
        );
    }

    return null;
}
