/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { PluginNative } from "@utils/types";

const Native = VencordNative.pluginHelpers.GraphTech as PluginNative<typeof import("./native")>;

export const VERSION = "1.1.0";

function isNewer(latest: string, current: string) {
    const a = latest.split(".").map(Number);
    const b = current.split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] ?? 0) - (b[i] ?? 0);
        if (diff !== 0) return diff > 0;
    }
    return false;
}

export async function checkForUpdate() {
    const latest = await Native.fetchLatestVersion();
    if (!/^\d+(\.\d+)*$/.test(latest) || !isNewer(latest, VERSION)) return;

    showNotification({
        title: "GraphTech : mise à jour disponible",
        body: `Version ${latest} disponible (tu as la ${VERSION}). Lance le script de mise à jour puis redémarre Discord.`,
        permanent: true
    });
}
