/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { TextInput, useEffect, useState } from "@webpack/common";

import type { getOwnAwardedBadges, LiveRealBadge } from "./badgeLogic";
import { REAL_BADGES, RealBadgeDef } from "./realBadges";
import type { CustomBadge } from "./settings";

export type AwardedBadgeList = ReturnType<typeof getOwnAwardedBadges>;

const BADGE_CATEGORIES: string[] = [...new Set(REAL_BADGES.map(b => b.category))];

function BadgeRow({ checked, onChange, name, iconSrc }: { checked: boolean; onChange: (v: boolean) => void; name: string; iconSrc: string; }) {
    return (
        <label className="vc-gt-badge-row" title={name}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.currentTarget.checked)} />
            <img src={iconSrc} alt="" />
            <span>{name}</span>
        </label>
    );
}

/** Badges reçus de l'équipe GraphTech (décernés) + badges Discord que tu possèdes vraiment. */
export function LiveBadgesPanel({
    awarded,
    hiddenAwarded,
    setAwardedVisible,
    liveBadges,
    isChecked,
    setChecked
}: {
    awarded: AwardedBadgeList;
    hiddenAwarded: Record<string, boolean>;
    setAwardedVisible: (id: string, visible: boolean) => void;
    liveBadges: LiveRealBadge[];
    isChecked: (id: string) => boolean;
    setChecked: (id: string, value: boolean) => void;
}) {
    return (
        <>
            {awarded.length > 0 && (
                <div className="vc-gt-section">
                    <div className="vc-gt-section-head">
                        <h3 className="vc-gt-section-title">Reçus de GraphTech ({awarded.length})</h3>
                    </div>
                    <div className="vc-gt-hint">
                        Décernés par l'équipe GraphTech. Décoche un badge pour le masquer sur ton profil, chez toi comme chez les autres.
                    </div>
                    <div className="vc-gt-badge-grid">
                        {awarded.map(b => (
                            <BadgeRow
                                key={b.id}
                                name={b.name}
                                iconSrc={b.iconSrc}
                                checked={!hiddenAwarded[b.id]}
                                onChange={v => setAwardedVisible(b.id, v)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="vc-gt-section">
                <div className="vc-gt-section-head">
                    <h3 className="vc-gt-section-title">{liveBadges.length} badge{liveBadges.length > 1 ? "s" : ""} Discord détecté{liveBadges.length > 1 ? "s" : ""}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button size="small" variant="secondary" onClick={() => liveBadges.forEach(b => setChecked(b.id, true))}>Tout afficher</Button>
                        <Button size="small" variant="dangerPrimary" onClick={() => liveBadges.forEach(b => setChecked(b.id, false))}>Tout masquer</Button>
                    </div>
                </div>

                {liveBadges.length === 0 && <div className="vc-gt-empty">Aucun badge détecté sur ton profil pour l'instant.</div>}

                <div className="vc-gt-badge-grid">
                    {liveBadges.map(b => (
                        <BadgeRow key={b.id} name={b.description} iconSrc={b.iconSrc} checked={isChecked(b.id)} onChange={v => setChecked(b.id, v)} />
                    ))}
                </div>
            </div>
        </>
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
        <div className="vc-gt-section">
            <div className="vc-gt-section-head">
                <h3 className="vc-gt-section-title">{category}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button size="small" variant="secondary" onClick={() => badges.forEach(b => setChecked(b.id, true))}>Tout cocher</Button>
                    <Button size="small" variant="secondary" onClick={() => badges.forEach(b => setChecked(b.id, false))}>Tout décocher</Button>
                </div>
            </div>
            <div className="vc-gt-badge-grid">
                {badges.map(b => (
                    <BadgeRow key={b.id} name={b.name} iconSrc={b.iconSrc} checked={isChecked(b.id)} onChange={v => setChecked(b.id, v)} />
                ))}
            </div>
        </div>
    );
}

/**
 * Badges que tu ne possèdes pas, à ajouter à ton profil (cosmétique).
 * Un badge n'est affiché que si sa case est cochée *explicitement* (décoché par défaut) ;
 * ceux que tu possèdes déjà sont gérés dans « Mes badges » et n'apparaissent pas ici.
 */
export function AddBadgesPanel({
    ownedIds,
    isAdded,
    setAdded
}: {
    ownedIds: Set<string>;
    isAdded: (id: string) => boolean;
    setAdded: (id: string, value: boolean) => void;
}) {
    const [query, setQuery] = useState("");
    const q = query.trim().toLowerCase();

    const available = REAL_BADGES.filter(b => !ownedIds.has(b.id));
    const alreadyOwned = REAL_BADGES.length - available.length;

    const sections = BADGE_CATEGORIES
        .map(category => ({
            category,
            badges: available.filter(b => b.category === category && (!q || b.name.toLowerCase().includes(q)))
        }))
        .filter(s => s.badges.length > 0);

    return (
        <>
            <div className="vc-gt-toolbar">
                <div className="vc-gt-search">
                    <TextInput value={query} onChange={setQuery} placeholder="Rechercher un badge…" />
                </div>
            </div>

            {alreadyOwned > 0 && (
                <div className="vc-gt-hint">
                    {alreadyOwned} badge{alreadyOwned > 1 ? "s" : ""} ne {alreadyOwned > 1 ? "sont" : "est"} pas listé{alreadyOwned > 1 ? "s" : ""} ici car tu {alreadyOwned > 1 ? "les" : "le"} possèdes déjà — gère-{alreadyOwned > 1 ? "les" : "le"} dans « Mes badges ».
                </div>
            )}

            {sections.length === 0 && <div className="vc-gt-empty">Aucun badge ne correspond à « {query} ».</div>}

            {sections.map(s => (
                <CategorySection key={s.category} category={s.category} badges={s.badges} isChecked={isAdded} setChecked={setAdded} />
            ))}
        </>
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
            return <div className="vc-gt-error">⚠️ Le lien doit commencer par <b>https://</b> (un lien en http:// simple est bloqué par Discord et affichera un rond gris).</div>;
        case "checking":
            return <div className="vc-gt-hint">Vérification du lien…</div>;
        case "error":
            return <div className="vc-gt-error">⚠️ Cette image ne charge pas. Il faut un lien <b>direct</b> vers le fichier (se termine par .png, .jpg, .webp ou .gif), pas un lien vers une page web. Astuce : colle le lien dans un nouvel onglet de ton navigateur, il doit afficher directement l'image.</div>;
        case "ok":
            return <div className="vc-gt-hint" style={{ color: "var(--text-positive, #23a55a)" }}>✓ Image valide</div>;
        default:
            return null;
    }
}

/** Badges 100 % à toi : un nom + une image. */
export function CustomBadgesPanel({
    customBadges,
    setCustomBadges
}: {
    customBadges: CustomBadge[];
    setCustomBadges: (updater: (prev: CustomBadge[]) => CustomBadge[]) => void;
}) {
    const [newName, setNewName] = useState("");
    const [newIconSrc, setNewIconSrc] = useState("");
    const iconStatus = useIconCheck(newIconSrc);
    const canAdd = !!newName.trim() && !!newIconSrc.trim() && iconStatus === "ok";

    function addCustomBadge() {
        if (!canAdd) return;
        const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        setCustomBadges(prev => [...prev, { id, name: newName.trim(), iconSrc: newIconSrc.trim() }]);
        setNewName("");
        setNewIconSrc("");
    }

    return (
        <>
            <div className="vc-gt-section">
                <div className="vc-gt-section-head">
                    <h3 className="vc-gt-section-title">Mes badges personnalisés ({customBadges.length})</h3>
                </div>
                {customBadges.length === 0 && <div className="vc-gt-empty">Aucun badge personnalisé pour l'instant.</div>}
                {customBadges.map(b => (
                    <div key={b.id} className="vc-gt-custom-row">
                        {b.iconSrc && <img src={b.iconSrc} alt="" />}
                        <span>{b.name}</span>
                        <Button size="small" variant="dangerPrimary" onClick={() => setCustomBadges(prev => prev.filter(x => x.id !== b.id))}>Retirer</Button>
                    </div>
                ))}
            </div>

            <div className="vc-gt-section">
                <div className="vc-gt-section-head">
                    <h3 className="vc-gt-section-title">Créer un badge</h3>
                </div>
                <div className="vc-gt-hint">
                    Utilise un lien <b>direct</b> en <b>https://</b> vers une image carrée (idéalement 128×128 px ou plus, PNG/JPG/WEBP/GIF).
                    Pour vérifier un lien, colle-le dans un nouvel onglet : il doit afficher directement l'image, pas une page web.
                </div>
                <div className="vc-gt-form">
                    <div className="vc-gt-form-field">
                        <div className="vc-gt-form-label">Nom</div>
                        <TextInput value={newName} onChange={setNewName} placeholder="Nom du badge" />
                    </div>
                    <div className="vc-gt-form-field" style={{ flex: 2 }}>
                        <div className="vc-gt-form-label">URL de l'image</div>
                        <TextInput value={newIconSrc} onChange={setNewIconSrc} placeholder="https://exemple.com/mon-badge.png" />
                    </div>
                    {iconStatus === "ok" && <img className="vc-gt-preview" src={newIconSrc.trim()} alt="" />}
                    <Button onClick={addCustomBadge} disabled={!canAdd}>Ajouter</Button>
                </div>
                <IconStatusHint status={iconStatus} />
            </div>
        </>
    );
}
