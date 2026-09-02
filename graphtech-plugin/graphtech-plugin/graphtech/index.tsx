/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { fetchUserProfile } from "@utils/discord";
import definePlugin from "@utils/types";
import { FluxDispatcher, useEffect, UserStore, useState } from "@webpack/common";

import { Catalog, findItem, getCatalog } from "./api";
import { applyHiddenBadges, buildExtraBadges } from "./badgeLogic";
import { settings } from "./settings";
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

/**
 * Pour un autre utilisateur que soi : va chercher (et cache) ses cosmétiques
 * partagés via le serveur GraphTech, et force un re-render une fois arrivés.
 */
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
        customBadges: settings.store.customBadges ?? []
    };
}

let lastPushedCosmeticsJson: string | null = null;

/** Envoie tes cosmétiques au serveur partagé, seulement si quelque chose a changé. */
async function syncOwnCosmeticsIfChanged() {
    const payload = ownCosmeticsPayload();
    const json = JSON.stringify(payload);
    if (json === lastPushedCosmeticsJson) return;

    if (await pushOwnCosmetics(payload)) lastPushedCosmeticsJson = json;
}

/**
 * Quand le profil de quelqu'un d'autre vient d'être chargé par Discord, va chercher
 * ses cosmétiques GraphTech en tâche de fond puis force un rafraîchissement de l'UI
 * en ré-émettant le même événement (marqué pour ne pas boucler sur nous-mêmes).
 */
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
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            replacement: {
                match: /(?<=\i\)\({avatarDecoration:)\i(?=,)(?<=currentUser:(\i).+?)/,
                replace: "$self.useGraphTechAvatarDecoration($1)??$&"
            }
        }
    ],

    useGraphTechAvatarDecoration,

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

        // Chaque étape est isolée : une erreur ici ne doit jamais empêcher l'intervalle
        // ci-dessous d'être mis en place, sinon le plugin se tait silencieusement pour
        // le reste de la session (c'est ce qui causait l'absence totale de sync).
        await refreshOwnProfile().catch(e => console.error("[GraphTech] refreshOwnProfile a échoué", e));
        await syncOwnCosmeticsIfChanged().catch(e => console.error("[GraphTech] sync initiale a échoué", e));

        clearInterval(enforceIntervalId);
        enforceIntervalId = setInterval(() => {
            applyHiddenBadges(settings);
            syncOwnCosmeticsIfChanged().catch(e => console.error("[GraphTech] sync périodique a échoué", e));
        }, 3000);
    },

    stop() {
        removeProfileBadge(dynamicBadgesEntry);
        clearInterval(enforceIntervalId);
        enforceIntervalId = undefined;
    }
});
