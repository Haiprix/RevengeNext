import { React, ReactNative } from "@revenge-mod/react";
import { allTags, type CustomTagsStorage } from "../lib/tags";
import { getIcon } from "../lib/icons";
import TagEditor from "./TagEditorAlert";
import TagTemplateEditor from "./TagTemplateEditor";

const { View, ScrollView, TouchableOpacity } = ReactNative;
const {
    TableSwitchRow,
    TextInput,
} = (revenge as any).discord.design.Design ?? {};

function SettingsText({
    children,
    style,
}: {
    children: any;
    style?: any;
}) {
    const { Text } = (revenge as any).discord.design.Design;

    return (
        <Text
            variant="text-md/medium"
            style={style}
        >
            {children}
        </Text>
    );
}

function SettingsNote({ children }: { children: any }) {
    const { Text } = (revenge as any).discord.design.Design;

    return (
        <View
            style={{
                marginHorizontal: 16,
                marginVertical: 8,
                padding: 12,
                borderRadius: 8,
            }}
        >
            <Text
                variant="text-sm/medium"
                color="text-muted"
            >
                {children}
            </Text>
        </View>
    );
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
                marginVertical: 6,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#5865F2",
                alignItems: "center",
            }}
        >
            <SettingsText
                style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                }}
            >
                {label}
            </SettingsText>
        </TouchableOpacity>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: any;
}) {
    const { TableRowGroup } =
        (revenge as any).discord.design.Design ?? {};

    if (!TableRowGroup) {
        return (
            <View style={{ marginVertical: 8 }}>
                <SettingsText
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        fontWeight: "700",
                    }}
                >
                    {title}
                </SettingsText>

                {children}
            </View>
        );
    }

    return (
        <TableRowGroup title={title}>
            {children}
        </TableRowGroup>
    );
}

function AddTagForm() {
    const [userId, setUserId] = React.useState("");

    const {
        TextInput,
    } = (revenge as any).discord.design.Design ?? {};

    return (
        <View
            style={{
                paddingHorizontal: 16,
                paddingBottom: 12,
            }}
        >
            {TextInput ? (
                <TextInput
                    label="User ID"
                    placeholder="Enter Discord User ID"
                    value={userId}
                    onChange={setUserId}
                />
            ) : (
                <View>
                    <SettingsText
                        style={{
                            marginBottom: 6,
                            fontWeight: "600",
                        }}
                    >
                        User ID
                    </SettingsText>

                    <ReactNative.TextInput
                        value={userId}
                        placeholder="Enter Discord User ID"
                        onChangeText={setUserId}
                        style={{
                            padding: 10,
                            borderRadius: 8,
                            backgroundColor: "rgba(128,128,128,0.15)",
                        }}
                    />
                </View>
            )}

            <Button
                label="Edit tag"
                onPress={() => {
                    if (!userId.trim()) return;

                    openTagEditor(
                        userId.trim(),
                        userId.trim()
                    );
                }}
            />
        </View>
    );
}

function TagRow({
    id,
    tag,
}: {
    id: string;
    tag: any;
}) {
    const {
        TableRow,
    } = (revenge as any).discord.design.Design ?? {};

    const icon =
        getIcon(tag.icon)?.fallback ||
        tag.customSvgFallback;

    const label =
        (
            icon
                ? `${icon} ${tag.text}`
                : tag.text
        ).trim() || id;

    const onPress = () =>
        openTagEditor(
            id,
            tag.text || id
        );

    if (TableRow) {
        return (
            <TableRow
                label={label}
                subLabel={`${id} • Tap to edit`}
                onPress={onPress}
                trailing={<TableRow.Arrow />}
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
            }}
        >
            <SettingsText
                style={{
                    fontWeight: "600",
                }}
            >
                {label}
            </SettingsText>

            <SettingsText
                style={{
                    marginTop: 4,
                    opacity: 0.7,
                    fontSize: 12,
                }}
            >
                {id} • Tap to edit
            </SettingsText>
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
    const {
        TableRow,
    } = (revenge as any).discord.design.Design ?? {};

    const icon =
        getIcon(tag.icon)?.fallback ||
        tag.customSvgFallback;

    const label =
        (
            icon
                ? `${icon} ${tag.text}`
                : tag.text
        ).trim() || name;

    const onPress = () =>
        openTagTemplateEditor(
            name,
            tag
        );

    if (TableRow) {
        return (
            <TableRow
                label={label}
                subLabel={`${name} • Tap to edit`}
                onPress={onPress}
                trailing={<TableRow.Arrow />}
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
            }}
        >
            <SettingsText
                style={{
                    fontWeight: "600",
                }}
            >
                {label}
            </SettingsText>

            <SettingsText
                style={{
                    marginTop: 4,
                    opacity: 0.7,
                    fontSize: 12,
                }}
            >
                {name} • Tap to edit
            </SettingsText>
        </TouchableOpacity>
    );
}

export default function Settings({
    jsonStorage,
}: {
    jsonStorage: CustomTagsStorage;
}) {
    const tags = allTags(jsonStorage);
    const userIds = Object.keys(tags);

    const savedTags =
        jsonStorage.savedTags || {};

    const savedTagNames =
        Object.keys(savedTags);

    const { ScrollView: DesignScrollView } =
        (revenge as any).react?.ReactNative ?? {};

    const Page =
        (revenge as any).components?.Page;

    const Content = (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                paddingBottom: 24,
            }}
        >
            <SettingsNote>
                Long-press a name in the member list or profile
                popout to tag someone directly, or add one here
                by User ID.
            </SettingsNote>

            <Section title="Add a tag">
                <AddTagForm />
            </Section>

            <Section title="Tagged users">
                {userIds.length === 0 ? (
                    <SettingsNote>
                        No one's tagged yet.
                    </SettingsNote>
                ) : (
                    userIds.map((id) => (
                        <TagRow
                            key={id}
                            id={id}
                            tag={tags[id]}
                        />
                    ))
                )}
            </Section>

            <Section title="Saved tag templates">
                {savedTagNames.length === 0 ? (
                    <SettingsNote>
                        No saved tags yet.
                    </SettingsNote>
                ) : (
                    savedTagNames.map((name) => (
                        <TemplateRow
                            key={name}
                            name={name}
                            tag={savedTags[name]}
                        />
                    ))
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
                            }
                        )
                    }
                />
            </Section>
        </ScrollView>
    );

    if (Page && DesignScrollView) {
        return (
            <Page>
                {Content}
            </Page>
        );
    }

    return Content;
}