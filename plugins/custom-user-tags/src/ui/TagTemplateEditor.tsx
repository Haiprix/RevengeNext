import { React, ReactNative } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";

import { TableSwitchRow, TextInput } from "@shared/ui/table";
import ColorInput from "./ColorInput";
import IconPicker from "./IconPicker";
import { isValidCustomSvg, MAX_CUSTOM_SVG_LENGTH } from "../lib/icons";
import type { UserTag, CustomTagsStorage } from "../lib/tags";

const { View } = ReactNative;
const ALERT_KEY = "custom-user-tags-template-editor";

// Looked up lazily since this repo hasn't needed Discord's native alert system
// before - safer to resolve it right when actually opening the editor.
function alertParts() {
    const alerts = lookupModule(
        withProps("openAlert", "dismissAlert")
    )?.[0] as any;

    const modal = lookupModule(
        withProps("AlertModal", "AlertActions")
    )?.[0] as any;

    return {
        openAlert: alerts?.openAlert,
        dismissAlert: alerts?.dismissAlert,
        AlertModal: modal?.AlertModal,
        AlertActions: modal?.AlertActions,
        AlertActionButton: modal?.AlertActionButton,
    };
}

function TagTemplateEditor({
    templateName,
    initialTag,
    jsonStorage,
}: {
    templateName: string;
    initialTag: UserTag;
    jsonStorage: CustomTagsStorage;
}) {
    const [text, setText] = React.useState(initialTag?.text ?? "");
    const [color, setColor] = React.useState(initialTag?.color ?? "#5865F2");
    const [icon, setIcon] = React.useState(initialTag?.icon ?? "none");
    const [svg, setSvg] = React.useState(initialTag?.customSvg ?? "");
    const [svgFallback, setSvgFallback] = React.useState(
        initialTag?.customSvgFallback ?? ""
    );
    const [iconOnly, setIconOnly] = React.useState(!!initialTag?.iconOnly);
    const [name, setName] = React.useState(templateName ?? "");
    const { dismissAlert, AlertModal, AlertActions, AlertActionButton } =
        alertParts();

    if (!AlertModal || !AlertActions || !AlertActionButton) return null;

    const hasIcon = icon !== "none" || !!svg.trim();

    const save = () => {
        if (svg.trim() && !isValidCustomSvg(svg)) {
            return;
        }
        if (!text.trim() && !hasIcon) {
            return;
        }
        if (iconOnly && !hasIcon) {
            return;
        }
        if (!name.trim()) {
            return;
        }

        const tagData: UserTag = {
            text: text.trim(),
            color,
            icon: svg.trim() ? undefined : icon === "none" ? undefined : icon,
            customSvg: svg.trim() || undefined,
            customSvgFallback: svgFallback.trim() || undefined,
            iconOnly,
        };

        jsonStorage.savedTags ??= {};
        jsonStorage.savedTags[name.trim()] = tagData;
        dismissAlert?.(ALERT_KEY);
    };

    const remove = () => {
        if (templateName) {
            jsonStorage.savedTags ??= {};
            delete jsonStorage.savedTags[templateName];
            dismissAlert?.(ALERT_KEY);
        }
    };

    return (
        <AlertModal
            title={templateName ? `Edit tag template` : `New tag template`}
            content={
                <View>
                    <TextInput
                        label="Template name"
                        placeholder="e.g. COOL_TAG, ADMIN, etc"
                        value={name}
                        onChange={setName}
                    />
                    <TextInput
                        label="Tag text"
                        placeholder="e.g. FRIEND"
                        value={text}
                        onChange={setText}
                    />
                    <IconPicker
                        title="Icon"
                        value={icon}
                        onChange={(v: string) => {
                            setIcon(v);
                            if (v !== "none") setSvg("");
                        }}
                        color={color}
                    />
                    <TextInput
                        label="Custom SVG"
                        placeholder="<svg>...</svg>"
                        value={svg}
                        multiline
                        onChange={setSvg}
                    />
                    {svg.trim() && (
                        <TextInput
                            label="SVG fallback (displayed if SVG fails)"
                            placeholder="e.g. 🔥"
                            value={svgFallback}
                            onChange={setSvgFallback}
                        />
                    )}
                    <ColorInput
                        title="Tag color"
                        value={color}
                        onChange={setColor}
                    />
                    <TableSwitchRow
                        label="Icon only"
                        subLabel="Display only the icon, hide text"
                        value={iconOnly}
                        onValueChange={setIconOnly}
                    />
                </View>
            }
            actions={
                <AlertActions>
                    {templateName && (
                        <AlertActionButton
                            title="Delete"
                            color="destructive"
                            onPress={remove}
                        />
                    )}
                    <AlertActionButton title="Cancel" onPress={() => dismissAlert?.(ALERT_KEY)} />
                    <AlertActionButton
                        title="Save"
                        color="primary"
                        onPress={save}
                    />
                </AlertActions>
            }
        />
    );
}

export default function openTagTemplateEditor(
    templateName: string,
    tag: UserTag,
    jsonStorage: CustomTagsStorage
): void {
    const { openAlert } = alertParts();

    if (!openAlert) return;

    openAlert({
        key: ALERT_KEY,
        content: (
            <TagTemplateEditor
                templateName={templateName}
                initialTag={tag}
                jsonStorage={jsonStorage}
            />
        ),
    });
}
