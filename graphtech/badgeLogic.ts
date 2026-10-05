/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ProfileBadge as RealProfileBadge } from "@vencord/discord-types";
import { UserProfileStore, UserStore } from "@webpack/common";

import { findRealBadge } from "./realBadges";
import type { GraphTechSettings } from "./settings";
import { getCachedRemoteCosmetics } from "./syncApi";

const PATCHED_MARKER = Symbol.for("graphtech.badgesPatched");

const trueBadgesByTarget = new WeakMap<object, RealProfileBadge[]>();
const patchedTargets = new Set<object>();

function computeHiddenIds(settings: GraphTechSettings): Set<string> {
    return new Set(
        Object.entries(settings.store.badgeOverrides ?? {})
            .filter(([, shouldShow]) => shouldShow === false)
            .map(([badgeId]) => badgeId)
    );
}

function getRawTargets(profile: any): any[] {
    const targets: any[] = [];
    if (profile?._userProfile) targets.push(profile._userProfile);
    if (profile?._guildMemberProfile) targets.push(profile._guildMemberProfile);
    if (!targets.length && profile) targets.push(profile);
    return targets;
}

function installLiveFilterOn(target: any, settings: GraphTechSettings) {
    if (!target || patchedTargets.has(target)) return;

    trueBadgesByTarget.set(target, Array.isArray(target.badges) ? target.badges : []);

    try {
        Object.defineProperty(target, "badges", {
            configurable: true,
            enumerable: true,
            get() {
                const trueList = trueBadgesByTarget.get(target) ?? [];
                const hiddenIds = computeHiddenIds(settings);
                return trueList.filter(b => !hiddenIds.has(b.id));
            },
            set(value) {
                trueBadgesByTarget.set(target, Array.isArray(value) ? value : []);
            }
        });
        patchedTargets.add(target);
    } catch {
        target.badges = (Array.isArray(target.badges) ? target.badges : []).filter(
            (b: RealProfileBadge) => !computeHiddenIds(settings).has(b.id)
        );
    }
}

export function applyHiddenBadges(settings: GraphTechSettings) {
    const userId = UserStore.getCurrentUser()?.id;
    if (!userId) return;

    const profile = UserProfileStore.getUserProfile(userId);
    if (!profile) return;

    for (const target of getRawTargets(profile)) {
        installLiveFilterOn(target, settings);
    }
}

export interface LiveRealBadge {
    id: string;
    description: string;
    iconSrc: string;
}

function realBadgeIconUrl(b: any): string {
    return b.simple_icon_url ?? `https://cdn.discordapp.com/badge-icons/${b.icon}.png`;
}

export function getLiveRealBadges(userId: string | undefined): LiveRealBadge[] {
    if (!userId) return [];

    const profile = UserProfileStore.getUserProfile(userId);
    if (!profile) return [];

    const combined: LiveRealBadge[] = [];
    for (const target of getRawTargets(profile)) {
        const list: any[] = trueBadgesByTarget.get(target) ?? (Array.isArray(target?.badges) ? target.badges : []);
        for (const b of list) {
            combined.push({ id: b.id, description: b.description ?? b.id, iconSrc: realBadgeIconUrl(b) });
        }
    }
    return combined;
}

export function getTrueOwnedBadgeIds(userId: string | undefined): Set<string> {
    if (!userId) return new Set();

    const profile = UserProfileStore.getUserProfile(userId);
    if (!profile) return new Set();

    const ids = new Set<string>();
    for (const target of getRawTargets(profile)) {
        const list = trueBadgesByTarget.get(target) ?? (Array.isArray(target?.badges) ? target.badges : []);
        for (const b of list) ids.add(b.id);
    }
    return ids;
}

export interface ExtraBadge {
    id: string;
    description: string;
    iconSrc: string;
    link?: string;
}

function badgesFromOverrides(
    owned: Set<string>,
    badgeOverrides: Record<string, boolean> | undefined,
    customBadges: { id: string; name: string; iconSrc: string; }[] | undefined
): ExtraBadge[] {
    const extra: ExtraBadge[] = [];

    for (const [badgeId, shouldShow] of Object.entries(badgeOverrides ?? {})) {
        if (!shouldShow || owned.has(badgeId)) continue;
        const def = findRealBadge(badgeId);
        if (!def) continue;
        extra.push({ id: `graphtech-fake-${def.id}`, description: def.name, iconSrc: def.iconSrc, link: def.link });
    }

    for (const custom of customBadges ?? []) {
        extra.push({ id: `graphtech-custom-${custom.id}`, description: custom.name, iconSrc: custom.iconSrc });
    }

    return extra;
}

/**
 * Construit les badges "fake" à afficher pour un utilisateur donné.
 * - Pour ton propre profil : lu directement depuis tes réglages locaux (instantané).
 * - Pour un autre utilisateur : lu depuis le cache des cosmétiques distants
 *   (voir syncApi.ts), rempli en tâche de fond quand son profil est ouvert.
 *   Renvoie [] tant que rien n'a encore été récupéré.
 */
export function buildExtraBadges(settings: GraphTechSettings, userId: string | undefined): ExtraBadge[] {
    if (!userId) return [];

    const owned = getTrueOwnedBadgeIds(userId);

    if (userId === UserStore.getCurrentUser()?.id) {
        return badgesFromOverrides(owned, settings.store.badgeOverrides, settings.store.customBadges);
    }

    const remote = getCachedRemoteCosmetics(userId);
    if (!remote) return [];
    return badgesFromOverrides(owned, remote.badgeOverrides, remote.customBadges);
}
