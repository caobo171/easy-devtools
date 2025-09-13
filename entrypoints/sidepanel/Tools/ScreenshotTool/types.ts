export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Annotation {
    id: string;
    type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'blur' | 'highlight' | 'pen';
    x: number;
    y: number;
    width?: number;
    height?: number;
    endX?: number;
    endY?: number;
    text?: string;
    color: string;
    fontSize?: number;
    strokeWidth?: number;
    selected?: boolean;
    opacity?: number;
}

export type EditMode = 'crop' | 'text' | 'arrow' | 'rectangle' | 'circle' | 'blur' | 'highlight' | 'pen' | 'select' | null;

export interface BackgroundStyle {
    type: 'solid' | 'gradient' | 'image';
    color?: string;
    gradient?: {
        type: 'linear' | 'radial';
        colors: string[];
        direction?: number;
    };
    image?: string;
}

export interface ImageAdjustments {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    padding: number;
    rounded: number;
    shadow: number;
    balanceImage: boolean;
    background: BackgroundStyle;
    insetBalance: boolean;
    inset: number;
}

export interface ScreenshotToolProps {
    initialImage?: string | null;
}
