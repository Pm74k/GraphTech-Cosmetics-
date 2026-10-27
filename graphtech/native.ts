/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";

const CATALOG_URL = "https://discosmetics.xyz/api/cosmetics";

const SYNC_BASE = "https://graphtech.duckdns.org";

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
            duplex: "half"
        } as RequestInit);
    } catch (e: any) {
        throw new Error(`Network error contacting sync server: ${e?.cause?.message ?? e?.message ?? e}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
