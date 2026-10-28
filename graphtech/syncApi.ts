/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { PluginNative } from "@utils/types";
import { UserStore } from "@webpack/common";

import type { CustomBadge } from "./settings";

const Native = VencordNative.pluginHelpers.GraphTech as PluginNative<typeof import("./native")>;

const TOKEN_STORE_KEY = "GraphTechSyncTokens";
const CACHE_TTL_MS = 1000 * 60 * 2;

export interface RemoteCosmetics {
    avatarDecorationId: string;
    profileEffectId: string;
    nameplateId: string;
    profileFrameId: string;
    badgeOverrides: Record<string, boolean>;
    customBadges: CustomBadge[];
    updatedAt: number;
}

export interface OwnCosmeticsPayload {
    avatarDecorationId: string;
    profileEffectId: string;
    nameplateId: string;
    profileFrameId: string;
    badgeOverrides: Record<string, boolean>;
    customBadges: CustomBadge[];
}

interface CacheEntry {
    data: RemoteCosmetics | null;
    fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<RemoteCosmetics | null>>();

function genToken(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function getOwnSyncToken(): Promise<string> {
    const userId = UserStore.getCurrentUser()?.id;
    if (!userId) throw new Error("Pas d'utilisateur connecté");

    const tokens = (await DataStore.get<Record<string, string>>(TOKEN_STORE_KEY)) ?? {};
    if (tokens[userId]) return tokens[userId];

    const token = genToken();
    tokens[userId] = token;
    await DataStore.set(TOKEN_STORE_KEY, tokens);
    return token;
}

function isFresh(entry: CacheEntry | undefined): boolean {
    return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export function getCachedRemoteCosmetics(userId: string): RemoteCosmetics | null | undefined {
    return cache.get(userId)?.data;
}

export async function ensureRemoteCosmetics(userId: string, forceRefresh = false): Promise<RemoteCosmetics | null> {
    const existing = cache.get(userId);
    if (!forceRefresh && isFresh(existing)) return existing!.data;

    const running = inFlight.get(userId);
    if (running) return running;

    const promise = (async () => {
        try {
            const data = await Native.fetchCosmetics(userId) as RemoteCosmetics;
            const normalized = data?.updatedAt ? data : null;
            cache.set(userId, { data: normalized, fetchedAt: Date.now() });
            return normalized;
        } catch {
            cache.set(userId, { data: existing?.data ?? null, fetchedAt: Date.now() });
            return existing?.data ?? null;
        } finally {
            inFlight.delete(userId);
        }
    })();

    inFlight.set(userId, promise);
    return promise;
}

export async function ensureRemoteCosmeticsBulk(userIds: string[]): Promise<void> {
    const toFetch = userIds.filter(id => !isFresh(cache.get(id)) && !inFlight.has(id));
    if (!toFetch.length) return;

    try {
        const map = await Native.fetchCosmeticsBulk(toFetch.slice(0, 100)) as Record<string, RemoteCosmetics>;
        const now = Date.now();
        for (const id of toFetch) {
            const data = map[id];
            cache.set(id, { data: data?.updatedAt ? data : null, fetchedAt: now });
        }
    } catch {
    }
}

export async function pushOwnCosmetics(payload: OwnCosmeticsPayload): Promise<boolean> {
    const userId = UserStore.getCurrentUser()?.id;
    if (!userId) return false;

    try {
        const token = await getOwnSyncToken();
        const body = JSON.parse(JSON.stringify({ token, ...payload }));
        const data = await Native.pushCosmetics(userId, body) as RemoteCosmetics;
        cache.set(userId, { data, fetchedAt: Date.now() });
        return true;
    } catch (e) {
        console.error("[GraphTech] pushOwnCosmetics a échoué", e);
        return false;
    }
}
