/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";

const CATALOG_URL = "https://discosmetics.xyz/api/cosmetics";

// Sert le même serveur que graphtech-website, via un sous-domaine DuckDNS (gratuit, stable).
const SYNC_BASE = "https://graphtech.duckdns.org";

// Toutes les requêtes réseau du plugin passent par le processus principal (ici) plutôt
// que par le renderer : le renderer applique la CSP de Discord, qui bloque par défaut
// les connexions vers des domaines non whitelistés (voir src/main/csp). Le processus
// principal n'y est pas soumis, donc pas besoin de faire approuver le domaine par
// l'utilisateur ni de redémarrer Discord après coup.

export async function fetchCatalog(_: IpcMainInvokeEvent) {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchCosmetics(_: IpcMainInvokeEvent, userId: string) {
    const res = await fetch(`${SYNC_BASE}/api/cosmetics/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchCosmeticsBulk(_: IpcMainInvokeEvent, userIds: string[]) {
    const ids = userIds.map(encodeURIComponent).join(",");
    const res = await fetch(`${SYNC_BASE}/api/cosmetics?ids=${ids}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function pushCosmetics(_: IpcMainInvokeEvent, userId: string, payload: unknown) {
    let res: Response;
    try {
        res = await fetch(`${SYNC_BASE}/api/cosmetics/${encodeURIComponent(userId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            // Node/Electron's fetch (undici) requires this when a request has a body,
            // otherwise it can fail with a generic "fetch failed" and no clear reason.
            duplex: "half"
        } as RequestInit);
    } catch (e: any) {
        // Surface the real underlying reason (e.cause) instead of a generic "fetch failed".
        throw new Error(`Network error contacting sync server: ${e?.cause?.message ?? e?.message ?? e}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
