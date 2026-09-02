/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { Button } from "@webpack/common";

import { openBadgesModal } from "./BadgesModal";
import { openPickerModal } from "./PickerModal";

export interface CustomBadge {
    id: string;
    name: string;
    iconSrc: string;
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
    picker: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={() => openPickerModal(settings)}>
                Choisir mon apparence (GraphTech)
            </Button>
        )
    },
    badgesPicker: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={() => openBadgesModal(settings)}>
                Gérer mes badges (GraphTech)
            </Button>
        )
    }
});

export type GraphTechSettings = typeof settings;
