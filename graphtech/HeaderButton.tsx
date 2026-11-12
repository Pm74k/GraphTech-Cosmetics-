/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { findComponentByCodeLazy } from "@webpack";

import { openGraphTechMenu } from "./Menu";
import { settings } from "./settings";

// Même composant d'icône que celui utilisé par Discord (et le Toolbox de Vencord) dans la barre du haut.
const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function Icon() {
    return (
        <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
            <path fill="currentColor" d="M10 2l1.9 5.6L17.5 9.5l-5.6 1.9L10 17l-1.9-5.6L2.5 9.5l5.6-1.9L10 2z" />
            <path fill="currentColor" d="M18.5 13l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
        </svg>
    );
}

export function GraphTechHeaderButton() {
    const { showHeaderButton } = settings.use(["showHeaderButton"]);
    if (!showHeaderButton) return null;

    return (
        <HeaderBarIcon
            className="vc-gt-header-btn"
            onClick={() => openGraphTechMenu(settings)}
            tooltip="GraphTech — apparence & badges"
            icon={Icon}
        />
    );
}
