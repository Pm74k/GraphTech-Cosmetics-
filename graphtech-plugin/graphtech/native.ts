/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";

const CATALOG_URL = "https://discosmetics.xyz/api/cosmetics";

export async function fetchCatalog(_: IpcMainInvokeEvent) {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
