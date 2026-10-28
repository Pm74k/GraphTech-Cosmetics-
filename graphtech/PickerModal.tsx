/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Button, Forms, Modal, SearchableSelect, TextInput, useEffect, useState } from "@webpack/common";

import { AvatarDecorationItem, Catalog, getCatalog, NameplateItem, ProfileEffectItem, ProfileFrameItem } from "./api";
import type { GraphTechSettings, Preset } from "./settings";

interface SelectOption {
    label: string;
    value: string;
    thumbnail?: string | null;
}

interface Filters {
    collection: string;
    theme: string;
    onlyFavorites: boolean;
    favorites: string[];
}

type Filterable = { id: string; name: string; collection?: string | null; themes?: string[]; };

function toOptions(items: Filterable[], thumbnails: (item: any) => string | null, selectedId: string, filters: Filters): SelectOption[] {
    const kept = items.filter(item =>
        item.id === selectedId
        || ((!filters.collection || item.collection === filters.collection)
            && (!filters.theme || item.themes?.includes(filters.theme))
            && (!filters.onlyFavorites || filters.favorites.includes(item.id)))
    );
    return [
        { label: "Aucune", value: "" },
        ...kept.map(item => ({
            label: `${filters.favorites.includes(item.id) ? "★ " : ""}${item.name}`,
            value: item.id,
            thumbnail: thumbnails(item)
        }))
    ];
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
    return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));
}

function Thumb({ src }: { src?: string | null; }) {
    if (!src) return null;
    return <img src={src} alt="" style={{ width: 24, height: 24, objectFit: "contain", marginRight: 8, borderRadius: 4 }} />;
}

function randomId(items: { id: string; }[], hasImage: (item: any) => boolean): string {
    const pool = items.filter(item => !/_none$/.test(item.id) && hasImage(item));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : "";
}

function PreviewStrip({ entries }: { entries: { label: string; src?: string | null; }[]; }) {
    return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} className={Margins.bottom16}>
            {entries.map(e => (
                <div key={e.label} style={{ textAlign: "center", width: 72 }}>
                    <div style={{ width: 64, height: 64, margin: "0 auto 4px", borderRadius: 8, background: "var(--background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {e.src ? <img src={e.src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </div>
                    <Forms.FormText style={{ fontSize: 11 }}>{e.label}</Forms.FormText>
                </div>
            ))}
        </div>
    );
}

function CategoryPicker({
    title,
    options,
    value,
    onChange,
    isFavorite,
    onToggleFavorite
}: {
    title: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    return (
        <section className={Margins.bottom16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Forms.FormTitle tag="h3">{title}</Forms.FormTitle>
                {value && (
                    <Button size={Button.Sizes.SMALL} look={Button.Looks.LINK} onClick={onToggleFavorite}>
                        {isFavorite ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
                    </Button>
                )}
            </div>
            <SearchableSelect
                options={options}
                value={options.find(o => o.value === value)?.value ?? ""}
                placeholder={`Choisir : ${title.toLowerCase()}`}
                maxVisibleItems={6}
                closeOnSelect
                clearable={false}
                renderOptionPrefix={(option: SelectOption) => <Thumb src={option.thumbnail} />}
                onChange={onChange}
            />
        </section>
    );
}

function PickerModalContent({ rootProps, settings }: { rootProps: RenderModalProps; settings: GraphTechSettings; }) {
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [avatarDecorationId, setAvatarDecorationId] = useState(settings.store.avatarDecorationId ?? "");
    const [profileEffectId, setProfileEffectId] = useState(settings.store.profileEffectId ?? "");
    const [nameplateId, setNameplateId] = useState(settings.store.nameplateId ?? "");
    const [profileFrameId, setProfileFrameId] = useState(settings.store.profileFrameId ?? "");

    const [favorites, setFavorites] = useState<string[]>(settings.store.favorites ?? []);
    const [collection, setCollection] = useState("");
    const [theme, setTheme] = useState("");
    const [onlyFavorites, setOnlyFavorites] = useState(false);

    function toggleFavorite(id: string) {
        if (!id) return;
        const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        setFavorites(next);
        settings.store.favorites = next;
    }

    const filters: Filters = { collection, theme, onlyFavorites, favorites };

    const [presets, setPresets] = useState<Preset[]>(settings.store.presets ?? []);
    const [presetName, setPresetName] = useState("");

    function savePresets(next: Preset[]) {
        setPresets(next);
        settings.store.presets = next;
    }

    function addPreset() {
        const name = presetName.trim();
        if (!name) return;
        const preset: Preset = { name, avatarDecorationId, profileEffectId, nameplateId, profileFrameId };
        savePresets([...presets.filter(x => x.name !== name), preset]);
        setPresetName("");
    }

    function applyPreset(preset: Preset) {
        setAvatarDecorationId(preset.avatarDecorationId);
        setProfileEffectId(preset.profileEffectId);
        setNameplateId(preset.nameplateId);
        setProfileFrameId(preset.profileFrameId);
    }

    function randomize() {
        if (!catalog) return;
        setAvatarDecorationId(randomId(catalog.avatar_decorations, i => !!i.thumbnail));
        setProfileEffectId(randomId(catalog.profile_effects, i => !!i.thumbnail));
        setNameplateId(randomId(catalog.nameplates, i => !!i.asset));
        setProfileFrameId(randomId(catalog.profile_frames, i => !!i.thumbnail));
    }

    useEffect(() => {
        getCatalog().then(setCatalog).catch(e => setError(String(e?.message ?? e)));
    }, []);

    function save() {
        settings.store.avatarDecorationId = avatarDecorationId;
        settings.store.profileEffectId = profileEffectId;
        settings.store.nameplateId = nameplateId;
        settings.store.profileFrameId = profileFrameId;
        rootProps.onClose();
    }

    return (
        <Modal
            {...rootProps}
            title="Apparence GraphTech"
            size="md"
            actions={[
                { text: "Enregistrer", variant: "primary", onClick: save, disabled: !catalog },
                { text: "Annuler", variant: "secondary", onClick: rootProps.onClose }
            ]}
        >
            <Forms.FormText className={Margins.bottom16}>
                Choisis les éléments à afficher sur ton profil. Ceci n'est visible que par toi et par
                les autres personnes ayant ce même plugin installé — ça n'achète ni ne débloque rien
                sur le vrai compte Discord.
            </Forms.FormText>

            {error && <Forms.FormText style={{ color: "var(--text-danger)" }} className={Margins.bottom16}>{error}</Forms.FormText>}

            {!catalog && !error && <Forms.FormText className={Margins.bottom16}>Chargement du catalogue…</Forms.FormText>}

            {catalog && <>
                <PreviewStrip entries={[
                    { label: "Décoration", src: catalog.avatar_decorations.find(i => i.id === avatarDecorationId)?.thumbnail },
                    { label: "Effet", src: catalog.profile_effects.find(i => i.id === profileEffectId)?.thumbnail },
                    { label: "Plaque", src: catalog.nameplates.find(i => i.id === nameplateId)?.asset },
                    { label: "Cadre", src: catalog.profile_frames.find(i => i.id === profileFrameId)?.thumbnail }
                ]} />
                <Button size={Button.Sizes.SMALL} onClick={randomize} className={Margins.bottom16}>🎲 Look aléatoire</Button>
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Filtrer le catalogue</Forms.FormTitle>
                    <div style={{ display: "flex", gap: 8 }} className={Margins.bottom8}>
                        <div style={{ flex: 1 }}>
                            <SearchableSelect
                                options={[{ label: "Toutes les collections", value: "" }, ...uniqueSorted([
                                    ...catalog.avatar_decorations.map(i => i.collection),
                                    ...catalog.profile_effects.map(i => i.collection),
                                    ...catalog.nameplates.map(i => i.collection),
                                    ...catalog.profile_frames.map(i => i.collection)
                                ]).map(c => ({ label: c, value: c }))]}
                                value={collection}
                                placeholder="Collection"
                                maxVisibleItems={6}
                                closeOnSelect
                                clearable={false}
                                onChange={setCollection}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <SearchableSelect
                                options={[{ label: "Tous les thèmes", value: "" }, ...uniqueSorted([
                                    ...catalog.avatar_decorations.flatMap(i => i.themes ?? []),
                                    ...catalog.profile_effects.flatMap(i => i.themes ?? []),
                                    ...catalog.nameplates.flatMap(i => i.themes ?? []),
                                    ...catalog.profile_frames.flatMap(i => i.themes ?? [])
                                ]).map(t => ({ label: t, value: t }))]}
                                value={theme}
                                placeholder="Thème"
                                maxVisibleItems={6}
                                closeOnSelect
                                clearable={false}
                                onChange={setTheme}
                            />
                        </div>
                    </div>
                    <Button size={Button.Sizes.SMALL} look={onlyFavorites ? Button.Looks.FILLED : Button.Looks.LINK} onClick={() => setOnlyFavorites(v => !v)}>
                        {onlyFavorites ? "★ Favoris seulement" : "☆ Favoris seulement"}
                    </Button>
                </section>
                <CategoryPicker
                    title="Décoration d'avatar"
                    options={toOptions(catalog.avatar_decorations, (i: AvatarDecorationItem) => i.thumbnail, avatarDecorationId, filters)}
                    value={avatarDecorationId}
                    onChange={setAvatarDecorationId}
                    isFavorite={favorites.includes(avatarDecorationId)}
                    onToggleFavorite={() => toggleFavorite(avatarDecorationId)}
                />
                <CategoryPicker
                    title="Effet de profil"
                    options={toOptions(catalog.profile_effects, (i: ProfileEffectItem) => i.thumbnail, profileEffectId, filters)}
                    value={profileEffectId}
                    onChange={setProfileEffectId}
                    isFavorite={favorites.includes(profileEffectId)}
                    onToggleFavorite={() => toggleFavorite(profileEffectId)}
                />
                <CategoryPicker
                    title="Plaque nominative"
                    options={toOptions(catalog.nameplates, (i: NameplateItem) => i.asset, nameplateId, filters)}
                    value={nameplateId}
                    onChange={setNameplateId}
                    isFavorite={favorites.includes(nameplateId)}
                    onToggleFavorite={() => toggleFavorite(nameplateId)}
                />
                <CategoryPicker
                    title="Cadre de profil"
                    options={toOptions(catalog.profile_frames, (i: ProfileFrameItem) => i.thumbnail, profileFrameId, filters)}
                    value={profileFrameId}
                    onChange={setProfileFrameId}
                    isFavorite={favorites.includes(profileFrameId)}
                    onToggleFavorite={() => toggleFavorite(profileFrameId)}
                />
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Presets</Forms.FormTitle>
                    <div style={{ display: "flex", gap: 8 }} className={Margins.bottom8}>
                        <TextInput value={presetName} onChange={setPresetName} placeholder="Nom du preset" />
                        <Button size={Button.Sizes.SMALL} onClick={addPreset} disabled={!presetName.trim()}>Enregistrer ce look</Button>
                    </div>
                    {presets.length === 0 && <Forms.FormText>Aucun preset enregistré.</Forms.FormText>}
                    {presets.map(preset => (
                        <div key={preset.name} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                            <span style={{ flex: 1 }}>{preset.name}</span>
                            <Button size={Button.Sizes.SMALL} onClick={() => applyPreset(preset)}>Appliquer</Button>
                            <Button size={Button.Sizes.SMALL} color={Button.Colors.RED} onClick={() => savePresets(presets.filter(x => x.name !== preset.name))}>Supprimer</Button>
                        </div>
                    ))}
                </section>
            </>}
        </Modal>
    );
}

export function openPickerModal(settings: GraphTechSettings) {
    openModal(rootProps => <PickerModalContent rootProps={rootProps} settings={settings} />);
}
