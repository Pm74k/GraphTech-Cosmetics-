/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { UserStore } from "@webpack/common";

import type { CustomBadge } from "./settings";

// Sert le même serveur que graphtech-website, via un nom nip.io pour avoir du
// HTTPS valide (Discord bloque le fetch() vers du http:// simple en "mixed content").
const SYNC_BASE = "https://82-41-119-126.nip.io";

const TOKEN_STORE_KEY = "GraphTechSyncTokens";
const CACHE_TTL_MS = 1000 * 60 * 2; // 2 minutes

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

/** Token stable par compte Discord, généré une fois et stocké localement (IndexedDB). */
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

/** Lecture synchrone du cache (ne déclenche aucun fetch). undefined = jamais fetché. */
export function getCachedRemoteCosmetics(userId: string): RemoteCosmetics | null | undefined {
    return cache.get(userId)?.data;
}

/**
 * S'assure que les cosmétiques distants d'un utilisateur sont en cache (frais).
 * Dédoublonne les requêtes concurrentes pour le même userId.
 */
export async function ensureRemoteCosmetics(userId: string, forceRefresh = false): Promise<RemoteCosmetics | null> {
    const existing = cache.get(userId);
    if (!forceRefresh && isFresh(existing)) return existing!.data;

    const running = inFlight.get(userId);
    if (running) return running;

    const promise = (async () => {
        try {
            const res = await fetch(`${SYNC_BASE}/api/cosmetics/${userId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json() as RemoteCosmetics;
            const normalized = data?.updatedAt ? data : null;
            cache.set(userId, { data: normalized, fetchedAt: Date.now() });
            return normalized;
        } catch {
            // En cas d'erreur réseau, on garde l'ancienne valeur en cache plutôt que d'effacer l'affichage
            cache.set(userId, { data: existing?.data ?? null, fetchedAt: Date.now() });
            return existing?.data ?? null;
        } finally {
            inFlight.delete(userId);
        }
    })();

    inFlight.set(userId, promise);
    return promise;
}

/** Récupère en une requête les cosmétiques de plusieurs utilisateurs (ex: liste de membres). */
export async function ensureRemoteCosmeticsBulk(userIds: string[]): Promise<void> {
    const toFetch = userIds.filter(id => !isFresh(cache.get(id)) && !inFlight.has(id));
    if (!toFetch.length) return;

    try {
        const res = await fetch(`${SYNC_BASE}/api/cosmetics?ids=${toFetch.slice(0, 100).join(",")}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const map = await res.json() as Record<string, RemoteCosmetics>;
        const now = Date.now();
        for (const id of toFetch) {
            const data = map[id];
            cache.set(id, { data: data?.updatedAt ? data : null, fetchedAt: now });
        }
    } catch {
        // on retentera individuellement via ensureRemoteCosmetics au prochain besoin
    }
}

export async function pushOwnCosmetics(payload: OwnCosmeticsPayload): Promise<boolean> {
    const userId = UserStore.getCurrentUser()?.id;
    if (!userId) return false;

    try {
        const token = await getOwnSyncToken();
        const res = await fetch(`${SYNC_BASE}/api/cosmetics/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, ...payload })
        });
        if (!res.ok) return false;

        const data = await res.json() as RemoteCosmetics;
        cache.set(userId, { data, fetchedAt: Date.now() });
        return true;
    } catch {
        return false;
    }
}
