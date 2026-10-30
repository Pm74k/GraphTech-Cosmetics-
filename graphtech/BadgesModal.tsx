/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, TextInput, UserStore, useEffect, useState } from "@webpack/common";

import { getLiveRealBadges, getOwnAwardedBadges, LiveRealBadge } from "./badgeLogic";
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
                <Heading tag="h3">Tes badges actuels ({liveBadges.length})</Heading>
                <Button
                    size="small"
                    variant="dangerPrimary"
                    onClick={() => liveBadges.forEach(b => setChecked(b.id, false))}
                >
                    Tout masquer
                </Button>
            </div>

            {liveBadges.length === 0 && <Paragraph>Aucun badge détecté sur ton profil pour l'instant.</Paragraph>}

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
                <Heading tag="h4">{category}</Heading>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button size="small" variant="secondary" onClick={() => badges.forEach(b => setChecked(b.id, true))}>Tout cocher</Button>
                    <Button size="small" variant="secondary" onClick={() => badges.forEach(b => setChecked(b.id, false))}>Tout décocher</Button>
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

function useIconCheck(url: string): IconStatus {
    const [status, setStatus] = useState<IconStatus>("idle");

    useEffect(() => {
        const trimmed = url.trim();
        if (!trimmed) {
            setStatus("idle");
            return;
        }
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
            return <Paragraph style={{ color: "var(--text-danger)" }}>⚠️ Le lien doit commencer par <b>https://</b> (un lien en http:// simple est bloqué par Discord et affichera un rond gris).</Paragraph>;
        case "checking":
            return <Paragraph>Vérification du lien…</Paragraph>;
        case "error":
            return <Paragraph style={{ color: "var(--text-danger)" }}>⚠️ Cette image ne charge pas. Il faut un lien <b>direct</b> vers le fichier (se termine par .png, .jpg, .webp ou .gif) — pas un lien vers une page web. Astuce : colle le lien dans un nouvel onglet de ton navigateur, il doit afficher directement l'image.</Paragraph>;
        case "ok":
            return <Paragraph style={{ color: "var(--text-positive)" }}>✓ Image valide</Paragraph>;
        default:
            return null;
    }
}

function CustomBadgeRow({ badge, onRemove }: { badge: CustomBadge; onRemove: () => void; }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            {badge.iconSrc && <img src={badge.iconSrc} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
            <span style={{ flexGrow: 1 }}>{badge.name}</span>
            <Button size="small" variant="dangerPrimary" onClick={onRemove}>Retirer</Button>
        </div>
    );
}

function BadgesModalContent({ rootProps, settings }: { rootProps: RenderModalProps; settings: GraphTechSettings; }) {
    const liveBadges = getLiveRealBadges(UserStore.getCurrentUser()?.id);

    const [overrides, setOverrides] = useState<Record<string, boolean>>({ ...(settings.store.badgeOverrides ?? {}) });
    const [customBadges, setCustomBadges] = useState<CustomBadge[]>([...(settings.store.customBadges ?? [])]);

    const awarded = getOwnAwardedBadges();
    const [hiddenAwarded, setHiddenAwarded] = useState<Record<string, boolean>>({ ...(settings.store.hiddenAwarded ?? {}) });

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
        settings.store.hiddenAwarded = hiddenAwarded;
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
            <Paragraph className={Margins.bottom16}>
                Visible uniquement par toi, sur ton propre client — ça ne change rien sur le vrai
                compte Discord. Si un changement ne s'affiche pas tout de suite, referme puis rouvre
                ton profil (ou redémarre le client).
            </Paragraph>

            {awarded.length > 0 && (
                <div className={Margins.bottom16}>
                    <Heading tag="h3">Badges reçus de GraphTech ({awarded.length})</Heading>
                    <Paragraph className={Margins.bottom8}>
                        Décernés par l'équipe GraphTech. Décoche un badge pour le masquer sur ton profil, chez toi comme chez les autres.
                    </Paragraph>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
                        {awarded.map(b => (
                            <BadgeRow
                                key={b.id}
                                name={b.name}
                                iconSrc={b.iconSrc}
                                checked={!hiddenAwarded[b.id]}
                                onChange={v => setHiddenAwarded(prev => ({ ...prev, [b.id]: !v }))}
                            />
                        ))}
                    </div>
                </div>
            )}

            <LiveBadgesSection liveBadges={liveBadges} isChecked={isChecked} setChecked={setChecked} />

            <Heading tag="h3">Ajouter un badge que tu ne possèdes pas</Heading>
            {BADGE_CATEGORIES.map(category => (
                <CategorySection
                    key={category}
                    category={category}
                    badges={REAL_BADGES.filter(b => b.category === category)}
                    isChecked={isChecked}
                    setChecked={setChecked}
                />
            ))}

            <Heading tag="h3">Badges personnalisés</Heading>
            <div className={Margins.bottom8}>
                {customBadges.length === 0 && <Paragraph>Aucun badge personnalisé.</Paragraph>}
                {customBadges.map(b => (
                    <CustomBadgeRow
                        key={b.id}
                        badge={b}
                        onRemove={() => setCustomBadges(prev => prev.filter(x => x.id !== b.id))}
                    />
                ))}
            </div>

            <Paragraph className={Margins.bottom8} style={{ opacity: 0.7 }}>
                Astuce : utilise un lien <b>direct</b> en <b>https://</b> vers une image carrée
                (idéalement 128×128px ou plus, format PNG/JPG/WEBP/GIF). Pour vérifier un lien,
                colle-le dans un nouvel onglet de ton navigateur : il doit afficher directement
                l'image, pas une page web.
            </Paragraph>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flexGrow: 1 }}>
                    <Heading tag="h5">Nom</Heading>
                    <TextInput value={newName} onChange={setNewName} placeholder="Nom du badge" />
                </div>
                <div style={{ flexGrow: 2 }}>
                    <Heading tag="h5">URL de l'image</Heading>
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
