export async function sendPushNotification(
    userIds: string[],
    title: string,
    message: string
) {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
        console.warn("[OneSignal Server] Faltam credenciais no backend. Push ignorado.");
        return { success: false, error: "Missing OneSignal Configuration" };
    }

    if (!userIds || userIds.length === 0) {
        return { success: false, error: "No user IDs provided" };
    }

    try {
        const payload = {
            app_id: appId,
            target_channel: "push",
            include_aliases: { external_id: userIds },
            headings: { en: title, pt: title },
            contents: { en: message, pt: message },
        };

        console.log("[OneSignal Server] Enviando push para external_ids:", userIds);

        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Key ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("[OneSignal Server] Falha ao enviar Push:", response.status, JSON.stringify(data));
            return { success: false, error: "API Error", status: response.status, details: data };
        }

        console.log("[OneSignal Server] Push enviado com sucesso:", JSON.stringify(data));
        return { success: true, data };
    } catch (error) {
        console.error("[OneSignal Server] Exceção ao despachar Push:", error);
        return { success: false, error: "Internal Exception" };
    }
}
