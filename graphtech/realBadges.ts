/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface RealBadgeDef {
    id: string;
    name: string;
    iconSrc: string;
    link?: string;
    category: string;
}

function badgeIcon(hash: string) {
    return `https://cdn.discordapp.com/badge-icons/${hash}.png`;
}

function assetIcon(hash: string) {
    return `https://discord.com/assets/${hash}.svg`;
}

const GENERAL = "Général";
const NITRO_SUB = "Nitro (abonnement)";
const NITRO_BOOST = "Nitro (boost de serveur)";
const GIFTING = "Cadeaux";

export const REAL_BADGES: RealBadgeDef[] = [
    { id: "staff", name: "Discord Staff", iconSrc: assetIcon("48d5bdcffe9e7848067c2e187f1ef951"), link: "https://discord.com/company", category: GENERAL },
    { id: "partner", name: "Partenaire", iconSrc: assetIcon("34306011e46e87f8ef25f3415d3b99ca"), link: "https://discord.com/partners", category: GENERAL },
    { id: "certified_moderator", name: "Modérateur certifié", iconSrc: assetIcon("c981e58b5ea4b7fedd3a643cf0c60564"), category: GENERAL },
    { id: "hypesquad", name: "HypeSquad Events", iconSrc: assetIcon("e666a84a7a5ea2abbbfa73adf22e627b"), category: GENERAL },
    { id: "hypesquad_house_1", name: "HypeSquad Bravery", iconSrc: assetIcon("efcc751513ec434ea4275ecda4f61136"), category: GENERAL },
    { id: "hypesquad_house_2", name: "HypeSquad Brilliance", iconSrc: assetIcon("ec8e92568a7c8f19a052ef42f862ff18"), category: GENERAL },
    { id: "hypesquad_house_3", name: "HypeSquad Balance", iconSrc: assetIcon("9f00b18e292e10fc0ae84ff5332e8b0b"), category: GENERAL },
    { id: "bug_hunter_level_1", name: "Bug Hunter", iconSrc: assetIcon("8353d89b529e13365c415aef08d1d1f4"), category: GENERAL },
    { id: "bug_hunter_level_2", name: "Bug Hunter Gold", iconSrc: assetIcon("f599063762165e0d23e8b11b684765a8"), category: GENERAL },
    { id: "early_supporter", name: "Early Supporter", iconSrc: assetIcon("b802e9af134ff492276d94220e36ec5c"), category: GENERAL },
    { id: "verified_developer", name: "Early Verified Bot Developer", iconSrc: assetIcon("4441e07fe0f46b3cb41b79366236fca6"), category: GENERAL },
    { id: "active_developer", name: "Active Developer", iconSrc: assetIcon("26c7a60fb1654315e0be26107bd47470"), category: GENERAL },
    { id: "premium", name: "Abonné Nitro", iconSrc: assetIcon("24d05f3b46a110e538674edbac0db4cd"), category: GENERAL },
    { id: "quest_completed", name: "Quête complétée", iconSrc: badgeIcon("7d9ae358c8c5e118768335dbe68b4fb8"), category: GENERAL },
    { id: "unique_username", name: "Ancien pseudo unique", iconSrc: badgeIcon("6de6d34650760ba5551a79732e98ed60"), category: GENERAL },

    { id: "nitro_bronze", name: "Nitro Bronze (1 mois)", iconSrc: assetIcon("0386191373eb17c272df"), category: NITRO_SUB },
    { id: "nitro_silver", name: "Nitro Argent (3 mois)", iconSrc: assetIcon("9d4d362c62da3c985845"), category: NITRO_SUB },
    { id: "nitro_gold", name: "Nitro Or (6 mois)", iconSrc: assetIcon("8725fe12ada9afa51c1a"), category: NITRO_SUB },
    { id: "nitro_platinum", name: "Nitro Platine (12 mois)", iconSrc: assetIcon("746689c803e06be87705"), category: NITRO_SUB },
    { id: "nitro_diamond", name: "Nitro Diamant (24 mois)", iconSrc: assetIcon("f3521e2861ff44a0384d"), category: NITRO_SUB },
    { id: "nitro_emerald", name: "Nitro Émeraude (36 mois)", iconSrc: assetIcon("f2b9b02fb22cc6459922"), category: NITRO_SUB },
    { id: "nitro_ruby", name: "Nitro Rubis (60 mois)", iconSrc: assetIcon("ecf86e18838013c9d95a"), category: NITRO_SUB },
    { id: "nitro_opal", name: "Nitro Opale (72+ mois)", iconSrc: assetIcon("b4fc7a9c37ec2fae36e3"), category: NITRO_SUB },

    { id: "boost_1", name: "Boost — 1 mois", iconSrc: assetIcon("ca18353be0e57a2b3b3132fa1c08d6b4"), category: NITRO_BOOST },
    { id: "boost_2", name: "Boost — 2 mois", iconSrc: assetIcon("22f99ed6e34eaca48950254c70f8fe8d"), category: NITRO_BOOST },
    { id: "boost_3", name: "Boost — 3 mois", iconSrc: assetIcon("4a2618502278029ce88adeea179ed435"), category: NITRO_BOOST },
    { id: "boost_6", name: "Boost — 6 mois", iconSrc: assetIcon("fbafa6adb7c49a6a2c3822521ff2af2f"), category: NITRO_BOOST },
    { id: "boost_9", name: "Boost — 9 mois", iconSrc: assetIcon("0599f90e32c15b532647163edd72f70a"), category: NITRO_BOOST },
    { id: "boost_12", name: "Boost — 1 an", iconSrc: assetIcon("e07c08cdc72bcc78b69c76d2c7ceb344"), category: NITRO_BOOST },
    { id: "boost_15", name: "Boost — 1 an et 3 mois", iconSrc: assetIcon("c7f26927db5e7806790f4e968038630a"), category: NITRO_BOOST },
    { id: "boost_18", name: "Boost — 1 an et 6 mois", iconSrc: assetIcon("c6d88d1d12afe03bdc4ebb747f8d196b"), category: NITRO_BOOST },
    { id: "boost_24", name: "Boost — 2 ans", iconSrc: assetIcon("d96ed283b74de75692487b7499fb8d09"), category: NITRO_BOOST },

    { id: "gift_patron", name: "Mécène (1 cadeau)", iconSrc: badgeIcon("ac305d1b9481f312ce4419e7f8296558"), category: GIFTING },
    { id: "gift_champion", name: "Champion (2 cadeaux)", iconSrc: badgeIcon("8b7792c4f65953d3ff564f23429cb79e"), category: GIFTING },
    { id: "gift_luminary", name: "Luminary (3 cadeaux)", iconSrc: badgeIcon("3119f5504b2cd09576a323908c7c3517"), category: GIFTING },
    { id: "gift_icon", name: "Icon (6 cadeaux)", iconSrc: badgeIcon("64f2413c9b9803661322aaad25826b62"), category: GIFTING },
    { id: "gift_hero", name: "Hero (10 cadeaux)", iconSrc: badgeIcon("77d65b1f210014a11eb1582ee06ab684"), category: GIFTING },
    { id: "gift_legend", name: "Legend (20 cadeaux)", iconSrc: badgeIcon("7fe346cfc5da1340087d8759a9e7a395"), category: GIFTING },
];

export function findRealBadge(id: string): RealBadgeDef | undefined {
    return REAL_BADGES.find(b => b.id === id);
}
