import { React, ReactNative } from "@revenge-mod/react";
import { allTags, type CustomTagsStorage } from "../lib/tags";
import { getIcon } from "../lib/icons";
import TagEditor from "./TagEditorAlert";
import TagTemplateEditor from "./TagTemplateEditor";

const {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
} = ReactNative;

interface SettingsProps {
    jsonStorage: CustomTagsStorage;
}

function Button({
    label,
    onPress,
}: {
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                marginHorizontal: 16,
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: "#5865F2",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "600",
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View style={{ marginTop: 16 }}>
            <Text
                style={{
                    paddingHorizontal: 16,
                    paddingBottom: 8,
                    fontSize: 14,
                    fontWeight: "700",
                }}
            >
                {title}
            </Text>

            <View>{children}</View>
        </View>
    );
}

function AddTagForm() {
    const [userId, setUserId] = React.useState("");

    return (
        <View
            style={{
                paddingHorizontal: 16,
            }}
        >
            <Text
                style={{
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: "600",
                }}
            >
                User ID
            </Text>

            <TextInput
                value={userId}
                placeholder="Enter Discord User ID"
                onChangeText={setUserId}
                style={{
                    minHeight: 44,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: "rgba(128,128,128,0.15)",
                }}
            />

            <Button
                label="Edit tag"
                onPress={() => {
                    const id = userId.trim();

                    if (!id) return;

                    openTagEditor(id, id);
                }}
            />
        </View>
    );
}

function UserRow({
    userId,
    tag,
}: {
    userId: string;
    tag: any;
}) {
    const icon =
        getIcon(tag.icon)?.fallback ||
        tag.customSvgFallback;

    const label =
        (
            icon
                ? `${icon} ${tag.text}`
                : tag.text
        ).trim() || userId;

    return (
        <TouchableOpacity
            onPress={() =>
                openTagEditor(
                    userId,
                    tag.text || userId
                )
            }
            style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
            }}
        >
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: "600",
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    marginTop: 4,
                    fontSize: 12,
                    opacity: 0.65,
                }}
            >
                {userId} • Tap to edit
            </Text>
        </TouchableOpacity>
    );
}

function TemplateRow({
    name,
    tag,
}: {
    name: string;
    tag: any;
}) {
    const icon =
        getIcon(tag.icon)?.fallback ||
        tag.customSvgFallback;

    const label =
        (
            icon
                ? `${icon} ${tag.text}`
                : tag.text
        ).trim() || name;

    return (
        <TouchableOpacity
            onPress={() =>
                openTagTemplateEditor(
                    name,
                    tag,
                    // This will be replaced below by the parent storage.
                    // Kept out of this component intentionally.
                    (null as any)
                )
            }
            style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
            }}
        >
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: "600",
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    marginTop: 4,
                    fontSize: 12,
                    opacity: 0.65,
                }}
            >
                {name} • Tap to edit
            </Text>
        </TouchableOpacity>
    );
}

export default function Settings({
    jsonStorage,
}: SettingsProps) {
    const tags = allTags(jsonStorage);
    const userIds = Object.keys(tags);

    const savedTags =
        jsonStorage.savedTags || {};

    const savedTagNames =
        Object.keys(savedTags);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                paddingBottom: 32,
            }}
        >
            <View
                style={{
                    marginHorizontal: 16,
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "rgba(128,128,128,0.12)",
                }}
            >
                <Text
                    style={{
                        fontSize: 14,
                        lineHeight: 20,
                    }}
                >
                    Long-press a name in the member list or profile
                    popout to tag someone directly, or add one here
                    by User ID.
                </Text>
            </View>

            <Section title="Add a tag">
                <AddTagForm />
            </Section>

            <Section title="Tagged users">
                {userIds.length === 0 ? (
                    <Text
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            opacity: 0.65,
                        }}
                    >
                        No one's tagged yet.
                    </Text>
                ) : (
                    userIds.map((userId) => (
                        <UserRow
                            key={userId}
                            userId={userId}
                            tag={tags[userId]}
                        />
                    ))
                )}
            </Section>

            <Section title="Saved tag templates">
                {savedTagNames.length === 0 ? (
                    <Text
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            opacity: 0.65,
                        }}
                    >
                        No saved tags yet.
                    </Text>
                ) : (
                    savedTagNames.map((name) => {
                        const tag = savedTags[name];

                        const icon =
                            getIcon(tag.icon)?.fallback ||
                            tag.customSvgFallback;

                        const label =
                            (
                                icon
                                    ? `${icon} ${tag.text}`
                                    : tag.text
                            ).trim() || name;

                        return (
                            <TouchableOpacity
                                key={name}
                                onPress={() =>
                                    openTagTemplateEditor(
                                        name,
                                        tag,
                                        jsonStorage
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "600",
                                    }}
                                >
                                    {label}
                                </Text>

                                <Text
                                    style={{
                                        marginTop: 4,
                                        fontSize: 12,
                                        opacity: 0.65,
                                    }}
                                >
                                    {name} • Tap to edit
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </Section>

            <Section title="Create saved template">
                <Button
                    label="New template"
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
            </Section>
        </ScrollView>
    );
}