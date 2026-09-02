/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { fetchUserProfile } from "@utils/discord";
import definePlugin from "@utils/types";
import { useEffect, UserStore, useState } from "@webpack/common";

import { Catalog, findItem, getCatalog } from "./api";
import { applyHiddenBadges, buildExtraBadges } from "./badgeLogic";
import { settings } from "./settings";

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

function useGraphTechAvatarDecoration(user?: { id: string; } | null): AvatarDecoration | null {
    const { avatarDecorationId } = settings.use(["avatarDecorationId"]);
    const catalog = useCatalog();

    if (!user || user.id !== UserStore.getCurrentUser()?.id) return null;
    if (!avatarDecorationId) return null;

    const item = findItem(catalog?.avatar_decorations, avatarDecorationId);
    if (!item?.asset) return null;

    return { asset: item.asset, skuId: MARKER_SKU_ID };
}

const dynamicBadgesEntry: ProfileBadge = {
    id: "graphtech-dynamic-badges",
    shouldShow: ({ userId }) => userId === UserStore.getCurrentUser()?.id,
    getBadges: () => buildExtraBadges(settings)
};

async function refreshOwnProfile() {
    const id = UserStore.getCurrentUser()?.id;
    if (id) await fetchUserProfile(id).catch(() => {});
    applyHiddenBadges(settings);
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
        USER_PROFILE_FETCH_SUCCESS: () => applyHiddenBadges(settings),
        USER_UPDATE: () => applyHiddenBadges(settings),
        CONNECTION_OPEN: () => refreshOwnProfile()
    },

    async start() {
        await getCatalog().catch(() => {});
        addProfileBadge(dynamicBadgesEntry);
        await refreshOwnProfile();

        clearInterval(enforceIntervalId);
        enforceIntervalId = setInterval(() => applyHiddenBadges(settings), 3000);
    },

    stop() {
        removeProfileBadge(dynamicBadgesEntry);
        clearInterval(enforceIntervalId);
        enforceIntervalId = undefined;
    }
});
