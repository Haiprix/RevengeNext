import { React, ReactNative } from "@revenge-mod/react";
import { TableRowGroup, TextInput } from "@shared/ui/table";
import SettingsScaffold from "@shared/ui/SettingsScaffold";
import ListSection from "@shared/ui/ListSection";
import PrimaryButton from "@shared/ui/PrimaryButton";
import NoteBox from "@shared/ui/NoteBox";
import { allTags, type CustomTagsStorage } from "../lib/tags";
import { getIcon } from "../lib/icons";
import TagEditor from "./TagEditorAlert";
import TagTemplateEditor from "./TagTemplateEditor";

const { View } = ReactNative;

interface SettingsProps {
    jsonStorage: CustomTagsStorage;
}

function AddTagForm() {
    const [userId, setUserId] = React.useState("");

    return (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TextInput
                label="User ID"
                placeholder="Enter Discord User ID"
                value={userId}
                onChange={setUserId}
            />

            <PrimaryButton
                label="Edit tag"
                disabled={!userId.trim()}
                style={{ marginTop: 8 }}
                onPress={() =>
                    openTagEditor(userId.trim(), userId.trim())
                }
            />
        </View>
    );
}

export default function Settings({ jsonStorage }: SettingsProps) {
    const tags = allTags(jsonStorage);
    const userIds = Object.keys(tags);
    const savedTags = jsonStorage.savedTags || {};
    const savedTagNames = Object.keys(savedTags);

    return (
        <SettingsScaffold>
            <NoteBox>
                Long-press a name in the member list or profile popout to tag
                someone directly, or add one here by User ID.
            </NoteBox>

            <TableRowGroup title="Add a tag">
                <AddTagForm />
            </TableRowGroup>

            <ListSection
                title="Tagged users"
                emptyText="No one's tagged yet."
                items={userIds.map((id) => {
                    const tag = tags[id];

                    const icon =
                        getIcon(tag.icon)?.fallback ||
                        tag.customSvgFallback;

                    const label =
                        (icon
                            ? `${icon} ${tag.text}`
                            : tag.text
                        ).trim() || id;

                    return {
                        key: id,
                        label,
                        subLabel: `${id} • Tap to edit`,
                        onPress: () =>
                            openTagEditor(
                                id,
                                tag.text || id
                            ),
                    };
                })}
            />

            <ListSection
                title="Saved tag templates"
                emptyText="No saved tags yet."
                items={savedTagNames.map((name) => {
                    const tag = savedTags[name];

                    const icon =
                        getIcon(tag.icon)?.fallback ||
                        tag.customSvgFallback;

                    const label =
                        (icon
                            ? `${icon} ${tag.text}`
                            : tag.text
                        ).trim() || name;

                    return {
                        key: name,
                        label,
                        subLabel: `Tap to apply • Swipe to delete`,
                        onPress: () =>
                            openTagTemplateEditor(
                                name,
                                tag,
                                jsonStorage
                            ),
                    };
                })}
            />

            <TableRowGroup title="Create saved template">
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <PrimaryButton
                        label="New template"
                        style={{ marginTop: 0 }}
                        onPress={() =>
                            openTagTemplateEditor(
                                "",
                                {
                                    text: "",
                                    color: "#5865F2",
                                    icon: "none",
                                },
                                jsonStorage
                            )
                        }
                    />
                </View>
            </TableRowGroup>
        </SettingsScaffold>
    );
}
