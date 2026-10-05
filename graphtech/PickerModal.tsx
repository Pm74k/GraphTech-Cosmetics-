/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Forms, Modal, SearchableSelect, useEffect, useState } from "@webpack/common";

import { AvatarDecorationItem, Catalog, getCatalog, NameplateItem, ProfileEffectItem, ProfileFrameItem } from "./api";
import type { GraphTechSettings } from "./settings";

interface SelectOption {
    label: string;
    value: string;
    thumbnail?: string | null;
}

function toOptions(items: { id: string; name: string; }[], thumbnails: (item: any) => string | null): SelectOption[] {
    return [
        { label: "Aucune", value: "" },
        ...items.map(item => ({ label: item.name, value: item.id, thumbnail: thumbnails(item) }))
    ];
}

function Thumb({ src }: { src?: string | null; }) {
    if (!src) return null;
    return <img src={src} alt="" style={{ width: 24, height: 24, objectFit: "contain", marginRight: 8, borderRadius: 4 }} />;
}

function CategoryPicker({
    title,
    options,
    value,
    onChange
}: {
    title: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <section className={Margins.bottom16}>
            <Forms.FormTitle tag="h3">{title}</Forms.FormTitle>
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
                <CategoryPicker
                    title="Décoration d'avatar"
                    options={toOptions(catalog.avatar_decorations, (i: AvatarDecorationItem) => i.thumbnail)}
                    value={avatarDecorationId}
                    onChange={setAvatarDecorationId}
                />
                <CategoryPicker
                    title="Effet de profil"
                    options={toOptions(catalog.profile_effects, (i: ProfileEffectItem) => i.thumbnail)}
                    value={profileEffectId}
                    onChange={setProfileEffectId}
                />
                <CategoryPicker
                    title="Plaque nominative"
                    options={toOptions(catalog.nameplates, (i: NameplateItem) => i.asset)}
                    value={nameplateId}
                    onChange={setNameplateId}
                />
                <CategoryPicker
                    title="Cadre de profil"
                    options={toOptions(catalog.profile_frames, (i: ProfileFrameItem) => i.thumbnail)}
                    value={profileFrameId}
                    onChange={setProfileFrameId}
                />
            </>}
        </Modal>
    );
}

export function openPickerModal(settings: GraphTechSettings) {
    openModal(rootProps => <PickerModalContent rootProps={rootProps} settings={settings} />);
}
