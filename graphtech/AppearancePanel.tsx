/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { TextInput, useState } from "@webpack/common";

import type { Catalog } from "./api";

export type AppearanceKind = "avatar" | "effect" | "nameplate" | "frame";

export interface GridItem {
    id: string;
    name: string;
    img: string | null;
    collection?: string | null;
    themes?: string[];
}

interface KindConfig {
    title: string;
    description: string;
    /** Éléments proposés par le catalogue pour cette catégorie. */
    items(catalog: Catalog): GridItem[];
    /** Un élément sans image n'est jamais tiré au sort. */
    hasImage(item: GridItem): boolean;
}

const toItem = (i: { id: string; name: string; collection?: string | null; themes?: string[]; }, img: string | null): GridItem =>
    ({ id: i.id, name: i.name, img, collection: i.collection, themes: i.themes });

export const APPEARANCE_KINDS: Record<AppearanceKind, KindConfig> = {
    avatar: {
        title: "Décoration d'avatar",
        description: "Le contour (animé ou non) affiché autour de ta photo de profil.",
        items: c => c.avatar_decorations.map(i => toItem(i, i.thumbnail)),
        hasImage: i => !!i.img
    },
    effect: {
        title: "Effet de profil",
        description: "L'animation affichée en fond de ta carte de profil.",
        items: c => c.profile_effects.map(i => toItem(i, i.thumbnail)),
        hasImage: i => !!i.img
    },
    nameplate: {
        title: "Plaque nominative",
        description: "Le bandeau décoratif derrière ton pseudo dans la liste des membres.",
        items: c => c.nameplates.map(i => toItem(i, i.asset)),
        hasImage: i => !!i.img
    },
    frame: {
        title: "Cadre de profil",
        description: "Le cadre qui entoure ta carte de profil.",
        items: c => c.profile_frames.map(i => toItem(i, i.thumbnail)),
        hasImage: i => !!i.img
    }
};

/** Tire un élément au hasard (jamais « aucun », jamais sans image) — même règle que l'ancien sélecteur. */
export function randomId(items: GridItem[], hasImage: (item: GridItem) => boolean): string {
    const pool = items.filter(item => !/_none$/.test(item.id) && hasImage(item));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : "";
}

const PAGE_SIZE = 120;

function uniqueSorted(values: (string | null | undefined)[]): string[] {
    return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));
}

export function Thumb({ src, fallback }: { src?: string | null; fallback?: string; }) {
    return (
        <div className="vc-gt-thumb">
            {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span>{fallback ?? "∅"}</span>}
        </div>
    );
}

function Tile({
    item,
    selected,
    favorite,
    onSelect,
    onToggleFavorite
}: {
    item: GridItem;
    selected: boolean;
    favorite: boolean;
    onSelect(): void;
    onToggleFavorite?(): void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            className={`vc-gt-tile${selected ? " is-selected" : ""}`}
            onClick={onSelect}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
            title={item.name}
        >
            {onToggleFavorite && (
                <button
                    type="button"
                    className={`vc-gt-fav${favorite ? " is-on" : ""}`}
                    title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
                >
                    {favorite ? "★" : "☆"}
                </button>
            )}
            <Thumb src={item.img} fallback={item.id ? item.name.charAt(0).toUpperCase() : "∅"} />
            <div className="vc-gt-tile-name">{item.name}</div>
        </div>
    );
}

export function AppearancePanel({
    kind,
    catalog,
    error,
    onRetry,
    value,
    onChange,
    favorites,
    onToggleFavorite
}: {
    kind: AppearanceKind;
    catalog: Catalog | null;
    error: string | null;
    onRetry(): void;
    value: string;
    onChange(id: string): void;
    favorites: string[];
    onToggleFavorite(id: string): void;
}) {
    const cfg = APPEARANCE_KINDS[kind];
    const [query, setQuery] = useState("");
    const [collection, setCollection] = useState("");
    const [theme, setTheme] = useState("");
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [shown, setShown] = useState(PAGE_SIZE);

    const items = catalog ? cfg.items(catalog) : [];
    const collections = uniqueSorted(items.map(i => i.collection));
    const themes = uniqueSorted(items.flatMap(i => i.themes ?? []));

    const q = query.trim().toLowerCase();
    const filtering = !!(q || collection || theme || onlyFavorites);
    const filtered = items.filter(i =>
        (!q || i.name.toLowerCase().includes(q))
        && (!collection || i.collection === collection)
        && (!theme || i.themes?.includes(theme))
        && (!onlyFavorites || favorites.includes(i.id))
    );
    const visible = filtered.slice(0, shown);
    const current = items.find(i => i.id === value);

    const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setShown(PAGE_SIZE); };

    return (
        <>
            <div className="vc-gt-head">
                <h2 className="vc-gt-title">{cfg.title}</h2>
                <p className="vc-gt-desc">{cfg.description}</p>
            </div>

            {error && (
                <div className="vc-gt-error">
                    Impossible de charger le catalogue : {error}{" "}
                    <Button size="small" onClick={onRetry}>Réessayer</Button>
                </div>
            )}

            {!catalog && !error && <div className="vc-gt-empty">Chargement du catalogue…</div>}

            {catalog && (
                <>
                    <div className="vc-gt-current">
                        <Thumb src={current?.img} fallback={current ? current.name.charAt(0).toUpperCase() : "∅"} />
                        <div className="vc-gt-current-info">
                            <div className="vc-gt-current-label">Sélection actuelle</div>
                            <div className="vc-gt-current-name">{current ? current.name : "Aucune"}</div>
                        </div>
                        {current && (
                            <>
                                <Button size="small" variant="secondary" onClick={() => onToggleFavorite(current.id)}>
                                    {favorites.includes(current.id) ? "★ Favori" : "☆ Favori"}
                                </Button>
                                <Button size="small" variant="dangerPrimary" onClick={() => onChange("")}>Retirer</Button>
                            </>
                        )}
                    </div>

                    <div className="vc-gt-toolbar">
                        <div className="vc-gt-search">
                            <TextInput
                                value={query}
                                onChange={reset(setQuery)}
                                placeholder={`Rechercher parmi ${items.length} éléments…`}
                            />
                        </div>
                        {collections.length > 0 && (
                            <select className="vc-gt-select" value={collection} onChange={e => reset(setCollection)(e.currentTarget.value)}>
                                <option value="">Toutes les collections</option>
                                {collections.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        {themes.length > 0 && (
                            <select className="vc-gt-select" value={theme} onChange={e => reset(setTheme)(e.currentTarget.value)}>
                                <option value="">Tous les thèmes</option>
                                {themes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                        <Button size="small" variant={onlyFavorites ? "primary" : "secondary"} onClick={() => reset(setOnlyFavorites)(!onlyFavorites)}>
                            {onlyFavorites ? "★ Favoris" : "☆ Favoris"}
                        </Button>
                    </div>
                    <div className="vc-gt-count-row">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</div>

                    <div className="vc-gt-scroll">
                        {filtered.length === 0 && (
                            <div className="vc-gt-empty">
                                {onlyFavorites && !q && !collection && !theme
                                    ? "Aucun favori ici pour l'instant — clique sur l'étoile d'un élément pour l'ajouter."
                                    : "Aucun résultat avec ces filtres."}
                            </div>
                        )}

                        <div className="vc-gt-grid">
                            {!filtering && <Tile item={{ id: "", name: "Aucune", img: null }} selected={value === ""} favorite={false} onSelect={() => onChange("")} />}
                            {visible.map(item => (
                                <Tile
                                    key={item.id}
                                    item={item}
                                    selected={item.id === value}
                                    favorite={favorites.includes(item.id)}
                                    onSelect={() => onChange(item.id)}
                                    onToggleFavorite={() => onToggleFavorite(item.id)}
                                />
                            ))}
                        </div>

                        {filtered.length > visible.length && (
                            <div className="vc-gt-more">
                                <Button onClick={() => setShown(n => n + PAGE_SIZE)}>
                                    Afficher plus ({filtered.length - visible.length} restants)
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
