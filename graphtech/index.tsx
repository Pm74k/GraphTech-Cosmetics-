/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { fetchUserProfile } from "@utils/discord";
import definePlugin from "@utils/types";
import { FluxDispatcher, useEffect, UserStore, useState } from "@webpack/common";

import { Catalog, findItem, getCatalog, getCatalogSync } from "./api";
import { applyHiddenBadges, buildExtraBadges } from "./badgeLogic";
import { settings } from "./settings";
import { checkForUpdate } from "./updateCheck";
import { ensureRemoteCosmetics, getCachedRemoteCosmetics, OwnCosmeticsPayload, pushOwnCosmetics } from "./syncApi";

export interface AvatarDecoration {
    asset: string;
    skuId: string;
}

const MARKER_SKU_ID = "graphtech-local-override";

function useCatalog(): Catalog | null {
    const [catalog, setCatalog] = useState<Catalog | null>(null);

    useEffect(() => {
        let cancelled = false;
        getCatalog().then(c => { if (!cancelled) setCatalog(c); }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return catalog;
}

function useRemoteCosmeticsFor(userId: string | undefined, isSelf: boolean) {
    const [, bump] = useState(0);

    useEffect(() => {
        if (!userId || isSelf) return;
        let cancelled = false;
        ensureRemoteCosmetics(userId).then(() => { if (!cancelled) bump(n => n + 1); }).catch(() => {});
        return () => { cancelled = true; };
    }, [userId, isSelf]);

    if (!userId || isSelf) return null;
    return getCachedRemoteCosmetics(userId) ?? null;
}

function useGraphTechAvatarDecoration(user?: { id: string; } | null): AvatarDecoration | null {
    const { avatarDecorationId: ownAvatarDecorationId } = settings.use(["avatarDecorationId"]);
    const catalog = useCatalog();
    const isSelf = !!user && user.id === UserStore.getCurrentUser()?.id;
    const remote = useRemoteCosmeticsFor(user?.id, isSelf);

    if (!user) return null;

    const avatarDecorationId = isSelf ? ownAvatarDecorationId : remote?.avatarDecorationId;
    if (!avatarDecorationId) return null;

    const item = findItem(catalog?.avatar_decorations, avatarDecorationId);
    if (!item?.asset) return null;

    return { asset: item.asset, skuId: MARKER_SKU_ID };
}

const dynamicBadgesEntry: ProfileBadge = {
    id: "graphtech-dynamic-badges",
    getBadges: ({ userId }) => buildExtraBadges(settings, userId)
};

async function refreshOwnProfile() {
    const id = UserStore.getCurrentUser()?.id;
    if (id) await fetchUserProfile(id).catch(() => {});
    applyHiddenBadges(settings);
}

function ownCosmeticsPayload(): OwnCosmeticsPayload {
    return {
        avatarDecorationId: settings.store.avatarDecorationId ?? "",
        profileEffectId: settings.store.profileEffectId ?? "",
        nameplateId: settings.store.nameplateId ?? "",
        profileFrameId: settings.store.profileFrameId ?? "",
        badgeOverrides: settings.store.badgeOverrides ?? {},
        customBadges: settings.store.customBadges ?? [],
        hiddenAwarded: settings.store.hiddenAwarded ?? {}
    };
}

function cosmeticsFor(userId: string | undefined) {
    if (!userId) return null;
    if (userId === UserStore.getCurrentUser()?.id) return ownCosmeticsPayload();
    return getCachedRemoteCosmetics(userId) ?? null;
}

function getProfileEffect(userId: string | undefined) {
    const id = cosmeticsFor(userId)?.profileEffectId;
    const skuId = findItem(getCatalogSync()?.profile_effects, id)?.skuId;
    if (skuId) return { skuId };
}

function getProfileFrame(userId: string | undefined) {
    const id = cosmeticsFor(userId)?.profileFrameId;
    const skuId = findItem(getCatalogSync()?.profile_frames, id)?.skuId;
    if (skuId) return { skuId };
}

function getNameplate(userId: string | undefined) {
    const id = cosmeticsFor(userId)?.nameplateId;
    const item = findItem(getCatalogSync()?.nameplates, id);
    if (!item?.skuId || !item.asset) return;
    const path = item.asset.split("/assets/collectibles/")[1]?.replace(/[^/]*$/, "");
    if (!path) return;
    return { skuId: item.skuId, asset: path, label: item.name, palette: "none" };
}

let lastPushedCosmeticsJson: string | null = null;

let lastRenderedProfileKey: string | null = null;
let lastAwardedKey: string | null = null;

async function syncOwnAwardedBadges() {
    const id = UserStore.getCurrentUser()?.id;
    if (!id) return;
    const remote = await ensureRemoteCosmetics(id);
    const key = JSON.stringify([remote?.awardedBadges ?? [], remote?.hiddenAwardedBadges ?? []]);
    if (key === lastAwardedKey) return;
    const first = lastAwardedKey === null;
    lastAwardedKey = key;
    if (!first || key !== "[[],[]]") await refreshOwnProfile().catch(() => {});
}

async function syncOwnCosmeticsIfChanged() {
    const payload = ownCosmeticsPayload();
    const json = JSON.stringify(payload);

    const profileKey = [payload.profileEffectId, payload.profileFrameId, payload.nameplateId].join("|");
    if (profileKey !== lastRenderedProfileKey) {
        const first = lastRenderedProfileKey === null;
        lastRenderedProfileKey = profileKey;
        if (!first) await refreshOwnProfile().catch(() => {});
    }
    if (json === lastPushedCosmeticsJson) return;

    if (await pushOwnCosmetics(payload)) lastPushedCosmeticsJson = json;
}

function syncOtherUserProfile(event: { userProfile?: { user?: { id?: string; }; }; __graphtechRebroadcast?: boolean; }) {
    if (event?.__graphtechRebroadcast) return;

    const fetchedId = event?.userProfile?.user?.id;
    if (!fetchedId || fetchedId === UserStore.getCurrentUser()?.id) return;

    ensureRemoteCosmetics(fetchedId).then(() => {
        FluxDispatcher.dispatch({
            type: "USER_PROFILE_FETCH_SUCCESS",
            userProfile: event.userProfile,
            __graphtechRebroadcast: true
        });
    }).catch(() => {});
}

let enforceIntervalId: ReturnType<typeof setInterval> | undefined;

export default definePlugin({
    name: "GraphTech",
    description: "Affiche localement une décoration d'avatar et des badges personnalisés sur ton profil (cosmétique uniquement, visible par toi et les autres utilisateurs de ce plugin).",
    tags: ["Appearance", "Customisation"],
    authors: [{ name: "pm74k", id: 0n }],

    settings,

    patches: [
        {
            find: "getAvatarDecorationURL:",
            replacement: {
                match: /(?<=function \i\(\i\){)(?=let{avatarDecoration)/,
                replace: "const vcGraphTechDecoration=$self.getGraphTechAvatarDecorationURL(arguments[0]);if(vcGraphTechDecoration)return vcGraphTechDecoration;"
            }
        },
        {
            find: "isAvatarDecorationAnimating:",
            group: true,
            replacement: [
                {
                    match: /(?<=\.avatarDecoration,guildId:\i\}\)\),)(?<=user:(\i).+?)/,
                    replace: "vcGraphTechAvatarDecoration=$self.useGraphTechAvatarDecoration($1),"
                },
                {
                    match: /(?<={avatarDecoration:).{1,20}?(?=,)(?<=avatarDecorationOverride:(\i).+?)/,
                    replace: "$1??vcGraphTechAvatarDecoration??($&)"
                },
                {
                    match: /(?<=size:\i}\),\[)/,
                    replace: "vcGraphTechAvatarDecoration,"
                }
            ]
        },
        {
            find: "this.popoutAnimationParticleType=",
            replacement: {
                match: /(this\.profileEffect=)(\i\?\.profileEffect\?\?\i\.profileEffect),(this\.profileFrame=)(\i\?\.profileFrame\?\?\i\.profileFrame)/,
                replace: "$1$self.getProfileEffect(this.userId)??$2,$3$self.getProfileFrame(this.userId)??$4"
            }
        },
        {
            find: "get nameplate(){",
            replacement: {
                match: /(get nameplate\(\){return\(0,\i\.\i\)\()(this\.collectibles\?\.nameplate\))/,
                replace: "$1$self.getNameplate(this.id)??$2"
            }
        },
        {
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            replacement: {
                match: /(?<=\i\)\({avatarDecoration:)\i(?=,)(?<=currentUser:(\i).+?)/,
                replace: "$self.useGraphTechAvatarDecoration($1)??$&"
            }
        }
    ],

    useGraphTechAvatarDecoration,
    getProfileEffect,
    getProfileFrame,
    getNameplate,

    getGraphTechAvatarDecorationURL({ avatarDecoration }: { avatarDecoration?: AvatarDecoration | null; }) {
        if (avatarDecoration?.skuId === MARKER_SKU_ID) return avatarDecoration.asset;
    },

    flux: {
        USER_PROFILE_FETCH_SUCCESS: (e: any) => {
            applyHiddenBadges(settings);
            syncOtherUserProfile(e);
        },
        USER_UPDATE: () => applyHiddenBadges(settings),
        CONNECTION_OPEN: () => refreshOwnProfile()
    },

    async start() {
        await getCatalog().catch(() => {});
        addProfileBadge(dynamicBadgesEntry);

        await refreshOwnProfile().catch(e => console.error("[GraphTech] refreshOwnProfile a échoué", e));
        await syncOwnCosmeticsIfChanged().catch(e => console.error("[GraphTech] sync initiale a échoué", e));

        checkForUpdate().catch(() => {});

        clearInterval(enforceIntervalId);
        enforceIntervalId = setInterval(() => {
            applyHiddenBadges(settings);
            syncOwnCosmeticsIfChanged().catch(e => console.error("[GraphTech] sync périodique a échoué", e));
            syncOwnAwardedBadges().catch(() => {});
        }, 3000);
    },

    stop() {
        removeProfileBadge(dynamicBadgesEntry);
        clearInterval(enforceIntervalId);
        enforceIntervalId = undefined;
    }
});
