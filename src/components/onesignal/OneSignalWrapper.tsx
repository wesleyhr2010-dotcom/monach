"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OneSignal from "react-onesignal";
import { createBrowserClient } from "@supabase/ssr";

export default function OneSignalWrapper() {
    const initialized = useRef(false);
    const isDev = process.env.NODE_ENV === "development";
    const [debugMsg, setDebugMsg] = useState<string | null>(null);

    const showLog = useCallback((msg: string) => {
        if (!isDev) return;
        setDebugMsg((prev) => (prev ? `${prev}\n${msg}` : msg));
    }, [isDev]);

    const scheduleLog = useCallback((msg: string) => {
        queueMicrotask(() => {
            showLog(msg);
        });
    }, [showLog]);

    useEffect(() => {
        if (initialized.current) return;

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) {
            scheduleLog("❌ NEXT_PUBLIC_ONESIGNAL_APP_ID ausente!");
            return;
        }
        scheduleLog(`AppID: ${appId.substring(0, 8)}...`);

        // Detectar modo standalone (PWA instalado)
        const maybeStandaloneNavigator = navigator as Navigator & {
            standalone?: boolean;
        };
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            maybeStandaloneNavigator.standalone === true;

        if (!isStandalone) {
            scheduleLog("⚠️ Modo browser — OneSignal só funciona na PWA instalada.");
            return;
        }

        const initOneSignal = async () => {
            try {
                scheduleLog("[1] Iniciando OneSignal.init...");

                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                    serviceWorkerParam: { scope: "/" },
                    // Compartilha o mesmo SW do PWA (public/sw.js importa o script da OneSignal).
                    // iOS PWA só permite um SW por scope — usar paths diferentes quebra a subscription.
                    serviceWorkerPath: "/sw.js",
                });

                scheduleLog("[2] ✅ Init OK.");
                initialized.current = true;

                // ─── Vincular device ao usuário Supabase ANTES do prompt ───
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const loginUser = async (userId: string) => {
                    scheduleLog(`[3] Login OneSignal: ${userId.substring(0, 12)}...`);
                    await OneSignal.login(userId);
                    scheduleLog("[3b] ✅ Login OK! external_id vinculado.");
                };

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user?.id) {
                    await loginUser(session.user.id);
                } else {
                    scheduleLog("[?] Sessão não encontrada. Aguardando...");
                    supabase.auth.onAuthStateChange(async (_event, currentSession) => {
                        if (currentSession?.user?.id) {
                            await loginUser(currentSession.user.id);
                        }
                    });
                }

                // No iOS PWA, Notification.requestPermission() só pode ser chamada uma vez por origem
                // e exige user gesture. Chamar aqui (no init automático) consome essa chance e a prompt
                // nunca mais aparece. A ativação fica em /app/perfil/notificaciones, dentro de um onClick.
                const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
                const pushId = await OneSignal.User.PushSubscription.id;
                scheduleLog(`[4] Push ativo: ${isPushEnabled} | ID: ${pushId?.substring(0, 12) || "null"}...`);
                scheduleLog(`[4b] Permission atual: ${typeof Notification !== "undefined" ? Notification.permission : "n/a"}`);
            } catch (err: unknown) {
                console.error("[OneSignal] Erro:", err);
                const message = err instanceof Error ? err.message : String(err);
                scheduleLog(`❌ ERRO: ${message}`);
            }
        };

        scheduleLog("🟢 PWA Standalone. Iniciando...");
        initOneSignal();
    }, [scheduleLog]);

    if (isDev && debugMsg) {
        return (
            <div className="fixed bottom-24 left-4 right-4 bg-black/90 text-green-400 p-4 rounded-xl z-[9999] text-[10px] font-mono whitespace-pre-wrap pointer-events-none break-all max-h-[40vh] overflow-auto">
                {debugMsg}
            </div>
        );
    }

    return null;
}
