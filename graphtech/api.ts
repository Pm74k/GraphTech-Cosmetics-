/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";

const Native = VencordNative.pluginHelpers.GraphTech as PluginNative<typeof import("./native")>;

const CACHE_KEY = "GraphTechCatalogCache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

export interface AvatarDecorationItem {
    id: string;
    name: string;
    type: "avatar_decoration";
    asset: string | null;
    thumbnail: string | null;
}

export interface ProfileEffectItem {
    id: string;
    name: string;
    type: "profile_effect";
    thumbnail: string | null;
}

export interface NameplateItem {
    id: string;
    name: string;
    type: "nameplate";
    asset: string | null;
}

export interface ProfileFrameItem {
    id: string;
    name: string;
    type: "profile_frame";
    thumbnail: string | null;
}

export interface Catalog {
    avatar_decorations: AvatarDecorationItem[];
    profile_effects: ProfileEffectItem[];
    nameplates: NameplateItem[];
    profile_frames: ProfileFrameItem[];
}

interface CacheShape {
    fetchedAt: number;
    catalog: Catalog;
}

let memoryCache: Catalog | null = null;

function readDiskCache(): CacheShape | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) as CacheShape : null;
    } catch {
        return null;
    }
}

function writeDiskCache(catalog: Catalog) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), catalog } satisfies CacheShape));
    } catch {
    }
}

export async function getCatalog(forceRefresh = false): Promise<Catalog> {
    if (memoryCache && !forceRefresh) return memoryCache;

    if (!forceRefresh) {
        const cached = readDiskCache();
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            memoryCache = cached.catalog;
            return cached.catalog;
        }
    }

    const data = await Native.fetchCatalog() as Catalog;
    memoryCache = data;
    writeDiskCache(data);
    return data;
}

export function findItem<T extends { id: string; }>(list: T[] | undefined, id: string | undefined | null): T | undefined {
    if (!id) return undefined;
    return list?.find(item => item.id === id);
}
