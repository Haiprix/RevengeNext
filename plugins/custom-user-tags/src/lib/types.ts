export interface UserTag {
    text: string;
    color: string;
    icon?: string;
    customSvg?: string;
    customSvgFallback?: string;
    iconOnly?: boolean;
}

export interface CustomTagsStorage {
    tags: Record<string, UserTag>;
}