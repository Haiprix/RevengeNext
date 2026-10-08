import { React, ReactNative } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";

import { TableSwitchRow, TextInput } from "@shared/ui/table";
import ColorInput from "./ColorInput";
import IconPicker from "./IconPicker";
import { isValidCustomSvg, MAX_CUSTOM_SVG_LENGTH } from "../lib/icons";
import { setSavedTag, removeSavedTag, type UserTag } from "../lib/tags";
import { getTagStorage } from "../lib/resolveTag";

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
}: {
    templateName: string;
    initialTag: UserTag;
}) {
    const storage = getTagStorage();
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

    if (!storage || !AlertModal || !AlertActions || !AlertActionButton) return null;

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

        // Renaming a template: drop the old name so it doesn't stay behind as a duplicate.
        if (templateName && templateName !== name.trim()) {
            void removeSavedTag(storage, templateName);
        }

        void setSavedTag(storage, name.trim(), tagData);
        dismissAlert?.(ALERT_KEY);
    };

    const remove = () => {
        if (templateName) {
            void removeSavedTag(storage, templateName);
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
                        maxLength={MAX_CUSTOM_SVG_LENGTH}
                        onChange={(v: string) => {
                            setSvg(v);
                            if (v) setIcon("none");
                        }}
                    />
                    {!!svg.trim() && (
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
                        disabled={!hasIcon}
                        onValueChange={setIconOnly}
                    />
                </View>
            }
            actions={
                <AlertActions>
                    <AlertActionButton text="Save" variant="primary" onPress={save} />
                    {!!templateName && (
                        <AlertActionButton text="Delete" variant="destructive" onPress={remove} />
                    )}
                    <AlertActionButton text="Cancel" variant="secondary" />
                </AlertActions>
            }
        />
    );
}

export default function openTagTemplateEditor(
    templateName: string,
    tag: UserTag
): void {
    const { openAlert } = alertParts();

    if (!openAlert) {
        console.log("Couldn't open the template editor - alert system not found");
        return;
    }

    openAlert(
        ALERT_KEY,
        <TagTemplateEditor templateName={templateName} initialTag={tag} />
    );
}
