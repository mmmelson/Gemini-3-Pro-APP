
export enum ShapeType {
  RANDOM = 'random',
  SPHERE = 'sphere',
  CUBE = 'cube',
  HELIX = 'helix',
  TEXT = 'text',
  RAIN = 'rain',
  STAR = 'star',
  FIRE = 'fire',
  TREE = 'tree',
  FLOWER = 'flower',
  BUTTERFLY = 'butterfly'
}

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  color: string;
  shape: ShapeType;
  textInput: string;
  rotationOffsets: { x: number; y: number; z: number }; // Angles in degrees (0-360)
}

export interface HandData {
  isPresent: boolean;
  gripStrength: number; // 0 (Open) to 1 (Fist)
  position: { x: number; y: number; z: number }; // Normalized -1 to 1
  rotation: { x: number; y: number; z: number };
  pinchDistance: number; // 0 to 1
  scale: number; // 1.0 is normal, >1 closer, <1 further
}

export type HandTrackerProps = {
  onHandUpdate: (data: HandData) => void;
  showCamera: boolean;
};
