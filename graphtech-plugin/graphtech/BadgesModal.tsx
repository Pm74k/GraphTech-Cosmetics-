/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Button, Forms, Modal, TextInput, UserStore, useEffect, useState } from "@webpack/common";

import { getLiveRealBadges, LiveRealBadge } from "./badgeLogic";
import { REAL_BADGES, RealBadgeDef } from "./realBadges";
import type { CustomBadge,GraphTechSettings } from "./settings";

const BADGE_CATEGORIES: string[] = [...new Set(REAL_BADGES.map(b => b.category))];

function BadgeRow({ checked, onChange, name, iconSrc }: { checked: boolean; onChange: (v: boolean) => void; name: string; iconSrc: string; }) {
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.currentTarget.checked)} />
            <img src={iconSrc} alt="" style={{ width: 20, height: 20 }} />
            <span>{name}</span>
        </label>
    );
}

function LiveBadgesSection({
    liveBadges,
    isChecked,
    setChecked
}: {
    liveBadges: LiveRealBadge[];
    isChecked: (id: string) => boolean;
    setChecked: (id: string, value: boolean) => void;
}) {
    return (
        <div className={Margins.bottom16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Forms.FormTitle tag="h3">Tes badges actuels ({liveBadges.length})</Forms.FormTitle>
                <Button
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.RED}
                    onClick={() => liveBadges.forEach(b => setChecked(b.id, false))}
                >
                    Tout masquer
                </Button>
            </div>

            {liveBadges.length === 0 && <Forms.FormText>Aucun badge détecté sur ton profil pour l'instant.</Forms.FormText>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
                {liveBadges.map(b => (
                    <BadgeRow
                        key={b.id}
                        name={b.description}
                        iconSrc={b.iconSrc}
                        checked={isChecked(b.id)}
                        onChange={v => setChecked(b.id, v)}
                    />
                ))}
            </div>
        </div>
    );
}

function CategorySection({
    category,
    badges,
    isChecked,
    setChecked
}: {
    category: string;
    badges: RealBadgeDef[];
    isChecked: (id: string) => boolean;
    setChecked: (id: string, value: boolean) => void;
}) {
    return (
        <div className={Margins.bottom16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Forms.FormTitle tag="h4">{category}</Forms.FormTitle>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button size={Button.Sizes.SMALL} look={Button.Looks.LINK} onClick={() => badges.forEach(b => setChecked(b.id, true))}>Tout cocher</Button>
                    <Button size={Button.Sizes.SMALL} look={Button.Looks.LINK} onClick={() => badges.forEach(b => setChecked(b.id, false))}>Tout décocher</Button>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
                {badges.map(b => (
                    <BadgeRow
                        key={b.id}
                        name={b.name}
                        iconSrc={b.iconSrc}
                        checked={isChecked(b.id)}
                        onChange={v => setChecked(b.id, v)}
                    />
                ))}
            </div>
        </div>
    );
}

type IconStatus = "idle" | "checking" | "ok" | "error" | "insecure";

/**
 * Teste en tâche de fond si une URL d'image charge réellement, pour éviter le
 * fameux "rond gris" (image cassée) sans aucune explication.
 */
function useIconCheck(url: string): IconStatus {
    const [status, setStatus] = useState<IconStatus>("idle");

    useEffect(() => {
        const trimmed = url.trim();
        if (!trimmed) {
            setStatus("idle");
            return;
        }
        // Discord charge son interface en https:// et bloque le contenu mixte :
        // une image en http:// simple ne s'affichera jamais (c'est la cause n°1 du "rond gris").
        if (!/^https:\/\//i.test(trimmed)) {
            setStatus("insecure");
            return;
        }

        let cancelled = false;
        setStatus("checking");

        const img = new Image();
        img.onload = () => { if (!cancelled) setStatus("ok"); };
        img.onerror = () => { if (!cancelled) setStatus("error"); };
        img.src = trimmed;

        return () => { cancelled = true; };
    }, [url]);

    return status;
}

function IconStatusHint({ status }: { status: IconStatus; }) {
    switch (status) {
        case "insecure":
            return <Forms.FormText style={{ color: "var(--text-danger)" }}>⚠️ Le lien doit commencer par <b>https://</b> (un lien en http:// simple est bloqué par Discord et affichera un rond gris).</Forms.FormText>;
        case "checking":
            return <Forms.FormText>Vérification du lien…</Forms.FormText>;
        case "error":
            return <Forms.FormText style={{ color: "var(--text-danger)" }}>⚠️ Cette image ne charge pas. Il faut un lien <b>direct</b> vers le fichier (se termine par .png, .jpg, .webp ou .gif) — pas un lien vers une page web. Astuce : colle le lien dans un nouvel onglet de ton navigateur, il doit afficher directement l'image.</Forms.FormText>;
        case "ok":
            return <Forms.FormText style={{ color: "var(--text-positive)" }}>✓ Image valide</Forms.FormText>;
        default:
            return null;
    }
}

function CustomBadgeRow({ badge, onRemove }: { badge: CustomBadge; onRemove: () => void; }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            {badge.iconSrc && <img src={badge.iconSrc} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
            <span style={{ flexGrow: 1 }}>{badge.name}</span>
            <Button size={Button.Sizes.SMALL} color={Button.Colors.RED} onClick={onRemove}>Retirer</Button>
        </div>
    );
}

function BadgesModalContent({ rootProps, settings }: { rootProps: RenderModalProps; settings: GraphTechSettings; }) {
    const liveBadges = getLiveRealBadges(UserStore.getCurrentUser()?.id);

    const [overrides, setOverrides] = useState<Record<string, boolean>>({ ...(settings.store.badgeOverrides ?? {}) });
    const [customBadges, setCustomBadges] = useState<CustomBadge[]>([...(settings.store.customBadges ?? [])]);

    const [newName, setNewName] = useState("");
    const [newIconSrc, setNewIconSrc] = useState("");
    const iconStatus = useIconCheck(newIconSrc);

    function isChecked(id: string) {
        return overrides[id] ?? true;
    }

    function setChecked(id: string, value: boolean) {
        setOverrides(prev => ({ ...prev, [id]: value }));
    }

    function addCustomBadge() {
        if (!newName.trim() || !newIconSrc.trim() || iconStatus !== "ok") return;
        const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        setCustomBadges(prev => [...prev, { id, name: newName.trim(), iconSrc: newIconSrc.trim() }]);
        setNewName("");
        setNewIconSrc("");
    }

    function save() {
        settings.store.badgeOverrides = overrides;
        settings.store.customBadges = customBadges;
        rootProps.onClose();
    }

    return (
        <Modal
            {...rootProps}
            title="Badges de profil GraphTech"
            size="md"
            actions={[
                { text: "Enregistrer", variant: "primary", onClick: save },
                { text: "Annuler", variant: "secondary", onClick: rootProps.onClose }
            ]}
        >
            <Forms.FormText className={Margins.bottom16}>
                Visible uniquement par toi, sur ton propre client — ça ne change rien sur le vrai
                compte Discord. Si un changement ne s'affiche pas tout de suite, referme puis rouvre
                ton profil (ou redémarre le client).
            </Forms.FormText>

            <LiveBadgesSection liveBadges={liveBadges} isChecked={isChecked} setChecked={setChecked} />

            <Forms.FormTitle tag="h3">Ajouter un badge que tu ne possèdes pas</Forms.FormTitle>
            {BADGE_CATEGORIES.map(category => (
                <CategorySection
                    key={category}
                    category={category}
                    badges={REAL_BADGES.filter(b => b.category === category)}
                    isChecked={isChecked}
                    setChecked={setChecked}
                />
            ))}

            <Forms.FormTitle tag="h3">Badges personnalisés</Forms.FormTitle>
            <div className={Margins.bottom8}>
                {customBadges.length === 0 && <Forms.FormText>Aucun badge personnalisé.</Forms.FormText>}
                {customBadges.map(b => (
                    <CustomBadgeRow
                        key={b.id}
                        badge={b}
                        onRemove={() => setCustomBadges(prev => prev.filter(x => x.id !== b.id))}
                    />
                ))}
            </div>

            <Forms.FormText className={Margins.bottom8} style={{ opacity: 0.7 }}>
                Astuce : utilise un lien <b>direct</b> en <b>https://</b> vers une image carrée
                (idéalement 128×128px ou plus, format PNG/JPG/WEBP/GIF). Pour vérifier un lien,
                colle-le dans un nouvel onglet de ton navigateur : il doit afficher directement
                l'image, pas une page web.
            </Forms.FormText>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flexGrow: 1 }}>
                    <Forms.FormTitle tag="h5">Nom</Forms.FormTitle>
                    <TextInput value={newName} onChange={setNewName} placeholder="Nom du badge" />
                </div>
                <div style={{ flexGrow: 2 }}>
                    <Forms.FormTitle tag="h5">URL de l'image</Forms.FormTitle>
                    <TextInput value={newIconSrc} onChange={setNewIconSrc} placeholder="https://exemple.com/mon-badge.png" />
                </div>
                {iconStatus === "ok" && <img src={newIconSrc.trim()} alt="" style={{ width: 32, height: 32, borderRadius: 6 }} />}
                <Button onClick={addCustomBadge} disabled={!newName.trim() || !newIconSrc.trim() || iconStatus !== "ok"}>Ajouter</Button>
            </div>
            <div className={Margins.bottom16}>
                <IconStatusHint status={iconStatus} />
            </div>
        </Modal>
    );
}

export function openBadgesModal(settings: GraphTechSettings) {
    openModal(rootProps => <BadgesModalContent rootProps={rootProps} settings={settings} />);
}
