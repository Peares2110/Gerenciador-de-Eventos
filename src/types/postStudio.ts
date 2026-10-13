export type LayerType = 'text' | 'badge' | 'button' | 'image' | 'shape';

export type StrategicZone = 'zone1_hook' | 'zone2_proof' | 'zone3_cta' | 'background' | 'free';

export interface PostLayer {
  id: string;
  name: string;
  type: LayerType;
  zone: StrategicZone;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  visible: boolean;
  locked: boolean;
  zIndex: number;
  
  // Content & Typography
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'uppercase' | 'none' | 'capitalize';

  // Appearance & Styling
  backgroundColor?: string;
  backgroundGradient?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Image & Asset
  imageUrl?: string;
  shapeType?: 'rectangle' | 'circle' | 'line' | 'divider';

  // Strategic Metadata
  strategicRole?: string;
}

export type CanvasFormat = 'feed_4_5' | 'story_9_16';

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  label: string;
}

export type EditorTool = 'select' | 'move' | 'text' | 'badge' | 'shape' | 'pan';

export interface PostEngineeringData {
  objectiveTitle: string;
  formatDimensions: string;
  zone1_hook: {
    eyebrow: string;
    mainHook: string;
    visualFocalPoint: string;
    contrastRatio: string;
    readingTimeMs: number;
  };
  zone2_proof: {
    headlinerText: string;
    supportingActs: string;
    authorityBadge: string;
    hierarchyScale: string;
    eyeFlowPattern: string;
  };
  zone3_cta: {
    urgencyTrigger: string;
    primaryCta: string;
    dateAndVenue: string;
    safeZoneBottomPadding: string;
  };
  heatmap: {
    primaryHotspot: { x: number; y: number; intensity: number; label: string };
    secondaryHotspot: { x: number; y: number; intensity: number; label: string };
    entryHotspot: { x: number; y: number; intensity: number; label: string };
    eyeTrackingFlow: string;
  };
  scorecard: {
    mobileReadability: number;
    contrastSafety: number;
    purchaseIntentIndex: number;
    scrollStopProbability: string;
    conversionAuditNotes: string[];
  };
  colorSystem: {
    primaryHex: string;
    secondaryHex: string;
    accentHex: string;
    backgroundHex: string;
  };
  aiImagePrompt: {
    cinematicPrompt: string;
    lightingStyle: string;
    negativeConstraints: string;
  };
}

export const FORMAT_DIMENSIONS: Record<CanvasFormat, CanvasDimensions> = {
  feed_4_5: {
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    label: 'Feed Portrait (1080 × 1350)'
  },
  story_9_16: {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    label: 'Stories / Reels (1080 × 1920)'
  }
};
