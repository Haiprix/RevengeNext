import { Svg, Path, SvgXml } from "@revenge-mod/react/native";
import type { IconDef } from "../lib/icons";

interface IconProps {
    icon: IconDef;
    size?: number;
    color?: string;
    style?: any;
}

// SVG components are provided by the React Native environment.
const { Svg, Path, SvgXml } = ReactNative as any;

export default function Icon({
    icon,
    size = 12,
    color = "#fff",
    style,
}: IconProps) {
    // Custom SVGs keep their own authored colors.
    if (icon.svg && SvgXml) {
        return (
            <SvgXml
                xml={icon.svg}
                width={size}
                height={size}
                style={style}
            />
        );
    }

    if (!icon.path || !Svg || !Path) return null;

    const viewBox = icon.viewBox ?? "0 0 24 24";

    return (
        <Svg
            width={size}
            height={size}
            viewBox={viewBox}
            fill={color}
            style={style}
        >
            <Path d={icon.path} />
        </Svg>
    );
}