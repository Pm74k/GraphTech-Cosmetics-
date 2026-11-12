/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { OptionType } from "@utils/types";

import { openGraphTechMenu } from "./Menu";

export interface CustomBadge {
    id: string;
    name: string;
    iconSrc: string;
}

export interface Preset {
    name: string;
    avatarDecorationId: string;
    profileEffectId: string;
    nameplateId: string;
    profileFrameId: string;
}

export const settings = definePluginSettings({
    avatarDecorationId: {
        type: OptionType.CUSTOM,
        default: ""
    },
    profileEffectId: {
        type: OptionType.CUSTOM,
        default: ""
    },
    nameplateId: {
        type: OptionType.CUSTOM,
        default: ""
    },
    profileFrameId: {
        type: OptionType.CUSTOM,
        default: ""
    },
    badgeOverrides: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, boolean>
    },
    customBadges: {
        type: OptionType.CUSTOM,
        default: [] as CustomBadge[]
    },
    presets: {
        type: OptionType.CUSTOM,
        default: [] as Preset[]
    },
    favorites: {
        type: OptionType.CUSTOM,
        default: [] as string[]
    },
    hiddenAwarded: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, boolean>
    },
    showHeaderButton: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Afficher le bouton GraphTech en haut à droite de Discord (à côté de la boîte de réception)"
    },
    menu: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={() => openGraphTechMenu(settings)}>
                Ouvrir le menu GraphTech
            </Button>
        )
    }
});

export type GraphTechSettings = typeof settings;
