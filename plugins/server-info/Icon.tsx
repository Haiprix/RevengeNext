import { React } from "@revenge-mod/react";
import { getSvgModule, type IconDef } from "../lib/icons";

interface IconProps {
    icon: IconDef;
    size?: number;
    color?: string;
    style?: any;
}

export default function Icon({
    icon,
    size = 12,
    color = "#fff",
    style,
}: IconProps) {
    // The SVG components come from Discord's own react-native-svg. They are looked up when the icon
    // is drawn, never when this file loads: a lookup (or a typo) at load time kills the whole plugin.
    const { Svg, Path, SvgXml } = (getSvgModule() ?? {}) as any;

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
