/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button } from "@components/Button";
import { openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, TextInput, useEffect, useMemo, UserStore, useState } from "@webpack/common";

import { Catalog, getCatalog } from "./api";
import { APPEARANCE_KINDS, AppearanceKind, AppearancePanel, GridItem, randomId, Thumb } from "./AppearancePanel";
import { getLiveRealBadges, getOwnAwardedBadges } from "./badgeLogic";
import { AddBadgesPanel, CustomBadgesPanel, LiveBadgesPanel } from "./BadgesPanels";
import type { CustomBadge, GraphTechSettings, Preset } from "./settings";

export type MenuPage = AppearanceKind | "presets" | "live" | "add" | "custom" | "about";

const SITE_URL = "https://graphtech.duckdns.org";

const KIND_ORDER: AppearanceKind[] = ["avatar", "effect", "nameplate", "frame"];

const NAV: { group: string; items: { id: MenuPage; icon: string; label: string; }[]; }[] = [
    {
        group: "Apparence",
        items: [
            { id: "avatar", icon: "🖼️", label: "Décoration d'avatar" },
            { id: "effect", icon: "✨", label: "Effet de profil" },
            { id: "nameplate", icon: "🏷️", label: "Plaque nominative" },
            { id: "frame", icon: "🔲", label: "Cadre de profil" },
            { id: "presets", icon: "💾", label: "Presets" }
        ]
    },
    {
        group: "Badges",
        items: [
            { id: "live", icon: "🏅", label: "Mes badges" },
            { id: "add", icon: "➕", label: "Ajouter des badges" },
            { id: "custom", icon: "🎨", label: "Badges perso" }
        ]
    },
    {
        group: "Plus",
        items: [{ id: "about", icon: "ℹ️", label: "À propos" }]
    }
];

const PAGE_HEADERS: Partial<Record<MenuPage, { title: string; description: string; }>> = {
    presets: { title: "Presets", description: "Enregistre un look complet (décoration, effet, plaque, cadre) et retrouve-le d'un clic." },
    live: { title: "Mes badges", description: "Décoche un badge pour le masquer sur ton profil, recoche-le pour le réafficher." },
    add: { title: "Ajouter des badges", description: "Coche les badges que tu veux afficher même si tu ne les possèdes pas." },
    custom: { title: "Badges perso", description: "Crée des badges avec ton propre nom et ta propre image." },
    about: { title: "À propos", description: "Comment fonctionne GraphTech." }
};

function sameJson(a: unknown, b: unknown) {
    return JSON.stringify(a) === JSON.stringify(b);
}

interface Look {
    avatarDecorationId: string;
    profileEffectId: string;
    nameplateId: string;
    profileFrameId: string;
}

function itemsOf(catalog: Catalog | null, kind: AppearanceKind): GridItem[] {
    return catalog ? APPEARANCE_KINDS[kind].items(catalog) : [];
}

function lookIds(look: Look): Record<AppearanceKind, string> {
    return { avatar: look.avatarDecorationId, effect: look.profileEffectId, nameplate: look.nameplateId, frame: look.profileFrameId };
}

/** Quatre petites vignettes : décoration, effet, plaque, cadre. */
function LookStrip({ catalog, look, onPick }: { catalog: Catalog | null; look: Look; onPick?(kind: AppearanceKind): void; }) {
    const ids = lookIds(look);
    return (
        <div className="vc-gt-strip">
            {KIND_ORDER.map(kind => {
                const item = itemsOf(catalog, kind).find(i => i.id === ids[kind]);
                return (
                    <button
                        key={kind}
                        type="button"
                        className="vc-gt-strip-item"
                        title={`${APPEARANCE_KINDS[kind].title} : ${item?.name ?? "aucune"}`}
                        onClick={() => onPick?.(kind)}
                    >
                        <Thumb src={item?.img} fallback="—" />
                    </button>
                );
            })}
        </div>
    );
}

function PresetsPanel({
    catalog,
    look,
    presets,
    onSavePresets,
    onApply
}: {
    catalog: Catalog | null;
    look: Look;
    presets: Preset[];
    onSavePresets(next: Preset[]): void;
    onApply(preset: Preset): void;
}) {
    const [name, setName] = useState("");

    function add() {
        const trimmed = name.trim();
        if (!trimmed) return;
        onSavePresets([...presets.filter(p => p.name !== trimmed), { name: trimmed, ...look }]);
        setName("");
    }

    return (
        <>
            <div className="vc-gt-section">
                <div className="vc-gt-section-head">
                    <h3 className="vc-gt-section-title">Enregistrer mon look actuel</h3>
                </div>
                <LookStrip catalog={catalog} look={look} />
                <div className="vc-gt-form" style={{ marginTop: 12 }}>
                    <div className="vc-gt-form-field">
                        <TextInput value={name} onChange={setName} placeholder="Nom du preset (ex. « Soirée », « Boulot »)" />
                    </div>
                    <Button onClick={add} disabled={!name.trim()}>Enregistrer ce look</Button>
                </div>
                <div className="vc-gt-hint">Un preset du même nom est remplacé. Les presets sont conservés immédiatement.</div>
            </div>

            <div className="vc-gt-section">
                <div className="vc-gt-section-head">
                    <h3 className="vc-gt-section-title">Mes presets ({presets.length})</h3>
                </div>
                {presets.length === 0 && <div className="vc-gt-empty">Aucun preset enregistré pour l'instant.</div>}
                {presets.map(preset => (
                    <div key={preset.name} className="vc-gt-preset-row">
                        <LookStrip catalog={catalog} look={preset} />
                        <span className="vc-gt-preset-name">{preset.name}</span>
                        <Button size="small" onClick={() => onApply(preset)}>Appliquer</Button>
                        <Button size="small" variant="dangerPrimary" onClick={() => onSavePresets(presets.filter(p => p.name !== preset.name))}>Supprimer</Button>
                    </div>
                ))}
                {presets.length > 0 && <div className="vc-gt-hint">« Appliquer » charge le look dans le menu : clique ensuite sur « Enregistrer » pour l'activer sur ton profil.</div>}
            </div>
        </>
    );
}

function AboutPanel({ onResetAppearance }: { onResetAppearance(): void; }) {
    return (
        <>
            <div className="vc-gt-card">
                <h4>100 % cosmétique</h4>
                <p>
                    Ce que tu choisis ici n'est visible que par toi et par les autres personnes qui ont ce même plugin installé.
                    Ça n'achète ni ne débloque rien sur ton vrai compte Discord, et rien n'est modifié côté Discord.
                </p>
            </div>
            <div className="vc-gt-card">
                <h4>Un changement ne s'affiche pas ?</h4>
                <p>Referme puis rouvre ton profil, ou redémarre le client. Les autres utilisateurs du plugin voient tes changements après quelques secondes.</p>
            </div>
            <div className="vc-gt-card">
                <h4>GraphTech Shop</h4>
                <p>
                    Plugins, bots et créations graphiques sur-mesure. <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL.replace("https://", "")}</a>
                </p>
            </div>
            <div className="vc-gt-card">
                <h4>Réinitialiser mon apparence</h4>
                <p style={{ marginBottom: 10 }}>Retire la décoration, l'effet, la plaque et le cadre (appliqué quand tu cliques sur « Enregistrer »).</p>
                <Button size="small" variant="dangerPrimary" onClick={onResetAppearance}>Tout retirer</Button>
            </div>
        </>
    );
}

function GraphTechMenu({ rootProps, settings, initialPage }: { rootProps: RenderModalProps; settings: GraphTechSettings; initialPage: MenuPage; }) {
    const [page, setPage] = useState<MenuPage>(initialPage);

    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Brouillon : tout est enregistré d'un coup avec « Enregistrer ».
    const [look, setLook] = useState<Look>({
        avatarDecorationId: settings.store.avatarDecorationId ?? "",
        profileEffectId: settings.store.profileEffectId ?? "",
        nameplateId: settings.store.nameplateId ?? "",
        profileFrameId: settings.store.profileFrameId ?? ""
    });
    const [overrides, setOverrides] = useState<Record<string, boolean>>({ ...(settings.store.badgeOverrides ?? {}) });
    const [customBadges, setCustomBadges] = useState<CustomBadge[]>([...(settings.store.customBadges ?? [])]);
    const [hiddenAwarded, setHiddenAwarded] = useState<Record<string, boolean>>({ ...(settings.store.hiddenAwarded ?? {}) });

    // Favoris et presets : conservés immédiatement (comme avant), indépendamment du bouton « Enregistrer ».
    const [favorites, setFavorites] = useState<string[]>(settings.store.favorites ?? []);
    const [presets, setPresets] = useState<Preset[]>(settings.store.presets ?? []);

    const liveBadges = useMemo(() => getLiveRealBadges(UserStore.getCurrentUser()?.id), []);
    const awarded = useMemo(() => getOwnAwardedBadges(), []);
    const ownedIds = useMemo(() => new Set(liveBadges.map(b => b.id)), [liveBadges]);

    function load(force = false) {
        setError(null);
        getCatalog(force).then(setCatalog).catch(e => setError(String(e?.message ?? e)));
    }
    useEffect(() => { load(); }, []);

    function toggleFavorite(id: string) {
        if (!id) return;
        const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        setFavorites(next);
        settings.store.favorites = next;
    }

    function savePresets(next: Preset[]) {
        setPresets(next);
        settings.store.presets = next;
    }

    const ids = lookIds(look);
    const setKind = (kind: AppearanceKind, id: string) => setLook(prev => ({
        ...prev,
        ...({ avatar: { avatarDecorationId: id }, effect: { profileEffectId: id }, nameplate: { nameplateId: id }, frame: { profileFrameId: id } } as const)[kind]
    }));

    function randomize() {
        if (!catalog) return;
        const pick = (kind: AppearanceKind) => randomId(itemsOf(catalog, kind), APPEARANCE_KINDS[kind].hasImage);
        setLook({ avatarDecorationId: pick("avatar"), profileEffectId: pick("effect"), nameplateId: pick("nameplate"), profileFrameId: pick("frame") });
    }

    const isChecked = (id: string) => overrides[id] ?? true;
    const setChecked = (id: string, value: boolean) => setOverrides(prev => ({ ...prev, [id]: value }));
    // Badges ajoutés : affichés seulement si cochés explicitement.
    const isAdded = (id: string) => overrides[id] === true;

    const stored: Look = {
        avatarDecorationId: settings.store.avatarDecorationId ?? "",
        profileEffectId: settings.store.profileEffectId ?? "",
        nameplateId: settings.store.nameplateId ?? "",
        profileFrameId: settings.store.profileFrameId ?? ""
    };
    const storedIds = lookIds(stored);
    const badgesDirty = !sameJson(overrides, settings.store.badgeOverrides ?? {});
    const dirty: Record<MenuPage, boolean> = {
        avatar: ids.avatar !== storedIds.avatar,
        effect: ids.effect !== storedIds.effect,
        nameplate: ids.nameplate !== storedIds.nameplate,
        frame: ids.frame !== storedIds.frame,
        presets: false,
        live: badgesDirty || !sameJson(hiddenAwarded, settings.store.hiddenAwarded ?? {}),
        add: badgesDirty,
        custom: !sameJson(customBadges, settings.store.customBadges ?? []),
        about: false
    };
    const anyDirty = Object.values(dirty).some(Boolean);

    function save() {
        settings.store.avatarDecorationId = look.avatarDecorationId;
        settings.store.profileEffectId = look.profileEffectId;
        settings.store.nameplateId = look.nameplateId;
        settings.store.profileFrameId = look.profileFrameId;
        settings.store.badgeOverrides = overrides;
        settings.store.customBadges = customBadges;
        settings.store.hiddenAwarded = hiddenAwarded;
        rootProps.onClose();
    }

    const resetAppearance = () => setLook({ avatarDecorationId: "", profileEffectId: "", nameplateId: "", profileFrameId: "" });

    function renderPage() {
        if (page === "avatar" || page === "effect" || page === "nameplate" || page === "frame") {
            return (
                <AppearancePanel
                    key={page}
                    kind={page}
                    catalog={catalog}
                    error={error}
                    onRetry={() => load(true)}
                    value={ids[page]}
                    onChange={id => setKind(page, id)}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />
            );
        }

        const header = PAGE_HEADERS[page]!;
        return (
            <>
                <div className="vc-gt-head">
                    <h2 className="vc-gt-title">{header.title}</h2>
                    <p className="vc-gt-desc">{header.description}</p>
                </div>
                <div className="vc-gt-scroll">
                    {page === "presets" && (
                        <PresetsPanel
                            catalog={catalog}
                            look={look}
                            presets={presets}
                            onSavePresets={savePresets}
                            onApply={preset => setLook({
                                avatarDecorationId: preset.avatarDecorationId,
                                profileEffectId: preset.profileEffectId,
                                nameplateId: preset.nameplateId,
                                profileFrameId: preset.profileFrameId
                            })}
                        />
                    )}
                    {page === "live" && (
                        <LiveBadgesPanel
                            awarded={awarded}
                            hiddenAwarded={hiddenAwarded}
                            setAwardedVisible={(id, visible) => setHiddenAwarded(prev => ({ ...prev, [id]: !visible }))}
                            liveBadges={liveBadges}
                            isChecked={isChecked}
                            setChecked={setChecked}
                        />
                    )}
                    {page === "add" && <AddBadgesPanel ownedIds={ownedIds} isAdded={isAdded} setAdded={setChecked} />}
                    {page === "custom" && <CustomBadgesPanel customBadges={customBadges} setCustomBadges={updater => setCustomBadges(updater)} />}
                    {page === "about" && <AboutPanel onResetAppearance={resetAppearance} />}
                </div>
            </>
        );
    }

    return (
        <Modal
            {...rootProps}
            title="GraphTech"
            subtitle="Personnalise ton profil — visible par toi et les autres utilisateurs du plugin"
            size="xxl"
            actions={[
                { text: anyDirty ? "Enregistrer les modifications" : "Enregistrer", variant: "primary", onClick: save },
                { text: "Annuler", variant: "secondary", onClick: rootProps.onClose }
            ]}
        >
            <div className="vc-gt-menu">
                <nav className="vc-gt-side">
                    <div className="vc-gt-side-scroll">
                        {NAV.map(section => (
                            <div key={section.group}>
                                <div className="vc-gt-side-group">{section.group}</div>
                                {section.items.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`vc-gt-nav${page === item.id ? " is-active" : ""}`}
                                        onClick={() => setPage(item.id)}
                                    >
                                        <span className="vc-gt-nav-icon">{item.icon}</span>
                                        <span className="vc-gt-nav-label">{item.label}</span>
                                        {dirty[item.id] && <span className="vc-gt-dot" title="Modifié, pas encore enregistré" />}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="vc-gt-look">
                        <div className="vc-gt-side-group" style={{ margin: "0 0 8px" }}>Mon look</div>
                        <LookStrip catalog={catalog} look={look} onPick={setPage} />
                        <Button size="small" variant="secondary" onClick={randomize} disabled={!catalog} className="vc-gt-random">🎲 Look aléatoire</Button>
                    </div>
                </nav>

                <div className="vc-gt-main">{renderPage()}</div>
            </div>
        </Modal>
    );
}

export function openGraphTechMenu(settings: GraphTechSettings, page: MenuPage = "avatar") {
    openModal(rootProps => <GraphTechMenu rootProps={rootProps} settings={settings} initialPage={page} />);
}
