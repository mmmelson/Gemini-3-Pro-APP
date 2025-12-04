import * as THREE from 'three';
import { ShapeType } from '../types';

// Helper to generate random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Generate positions based on shape type
export const generatePositions = (
  type: ShapeType,
  count: number,
  text: string = "AI"
): Float32Array => {
  const positions = new Float32Array(count * 3);
  const tempVec = new THREE.Vector3();

  // Special handling for text to ensure we get enough density
  if (type === ShapeType.TEXT) {
    return generateTextPositions(text, count);
  }

  for (let i = 0; i < count; i++) {
    switch (type) {
      case ShapeType.SPHERE:
        // Surface of sphere
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        tempVec.setFromSphericalCoords(12, phi, theta);
        break;

      case ShapeType.STAR:
        // A simple star shape/burst
        const rStar = 2 + Math.random() * 15;
        const uStar = Math.random();
        const vStar = Math.random();
        const thetaStar = 2 * Math.PI * uStar;
        const phiStar = Math.acos(2 * vStar - 1);
        const dist = Math.pow(Math.random(), 3) * 15; 
        tempVec.set(
          dist * Math.sin(phiStar) * Math.cos(thetaStar),
          dist * Math.sin(phiStar) * Math.sin(thetaStar),
          dist * Math.cos(phiStar)
        );
        break;

      case ShapeType.CUBE:
        tempVec.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        break;

      case ShapeType.HELIX:
        // Vertical DNA helix
        const t = i / count * 10 * Math.PI; 
        const yHelix = (i / count - 0.5) * 30;
        const radiusHelix = 8;
        // Double helix
        const offset = i % 2 === 0 ? 0 : Math.PI;
        tempVec.set(
          Math.cos(t + offset) * radiusHelix,
          yHelix,
          Math.sin(t + offset) * radiusHelix
        );
        break;
      
      case ShapeType.RAIN:
        // Cylinder distribution
        const rRain = Math.random() * 20;
        const thetaRain = Math.random() * Math.PI * 2;
        tempVec.set(
            rRain * Math.cos(thetaRain),
            (Math.random() - 0.5) * 40,
            rRain * Math.sin(thetaRain)
        );
        break;
        
      case ShapeType.FIRE:
        // Cone-ish shape, moving up
        const rFire = Math.random() * 6 * (1 - (i/count)); // wider at bottom
        const hFire = (Math.random() * 25) - 12.5;
        const thetaFire = Math.random() * Math.PI * 2;
        tempVec.set(
           (rFire + Math.random()) * Math.cos(thetaFire),
           hFire,
           (rFire + Math.random()) * Math.sin(thetaFire)
        );
        break;

      case ShapeType.TREE:
         // Cone tree - Upright
         const treeH = Math.random(); // 0 to 1
         const treeHeight = 30;
         const treeR = (1 - treeH) * 12;
         const treeTheta = Math.random() * Math.PI * 2;
         tempVec.set(
            treeR * Math.cos(treeTheta),
            (treeH * treeHeight) - (treeHeight/2),
            treeR * Math.sin(treeTheta)
         );
         break;

      case ShapeType.FLOWER:
        // Flower on XY Plane facing Z
        const k = 4; // 4 petals
        const flowerTheta = Math.random() * Math.PI * 2;
        // r = cos(k * theta)
        const rFlower = (12 * Math.abs(Math.cos(k * flowerTheta))) + 2 * Math.random(); 
        tempVec.set(
            rFlower * Math.cos(flowerTheta),
            rFlower * Math.sin(flowerTheta),
            (Math.random() - 0.5) * 2 // slight depth
        );
        break;

      case ShapeType.BUTTERFLY:
        // Butterfly on XY Plane facing Z
        const tBut = Math.random() * 12 * Math.PI; 
        // Parametric equations
        const rBut = Math.exp(Math.cos(tBut)) - 2 * Math.cos(4 * tBut) - Math.pow(Math.sin(tBut / 12), 5);
        
        const scale = 5;
        tempVec.set(
            rBut * Math.cos(tBut) * scale,
            rBut * Math.sin(tBut) * scale, // Swap Y/Z logic to make it stand up
            (Math.random() - 0.5) * 2
        );
        break;

      case ShapeType.RANDOM:
      default:
        // Uniform Box Distribution
        tempVec.set(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        );
        break;
    }

    positions[i * 3] = tempVec.x;
    positions[i * 3 + 1] = tempVec.y;
    positions[i * 3 + 2] = tempVec.z;
  }

  return positions;
};

// Generate 3D points from 2D text
const generateTextPositions = (text: string, targetCount: number): Float32Array => {
  const canvas = document.createElement('canvas');
  const size = 512; // Higher res for better text shape
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return new Float32Array(targetCount * 3);

  // Fill background black
  ctx.fillStyle = '#000000'; 
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff'; 
  
  // Calculate font size to fit text
  const baseFontSize = 300;
  ctx.font = `bold ${baseFontSize}px Arial`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  
  // Fit text into 90% of canvas width
  const padding = 40;
  const maxWidth = size - padding;
  let fontSize = baseFontSize;
  
  if (textWidth > maxWidth) {
    fontSize = Math.floor(baseFontSize * (maxWidth / textWidth));
  }
  
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const validPixels: { x: number; y: number }[] = [];

  // Sampling step: Use 2 for higher precision on small text/thin lines
  // Was 4, but 2 is safer for scaled-down text
  const step = 2; 
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const index = (y * size + x) * 4;
      // Check red channel, if bright enough, it's part of text
      if (data[index] > 128) { 
        validPixels.push({ x, y });
      }
    }
  }

  const positions = new Float32Array(targetCount * 3);

  // Fallback to sphere if no text pixels found (e.g. empty string)
  if (validPixels.length === 0) {
      return generatePositions(ShapeType.SPHERE, targetCount);
  }

  for (let i = 0; i < targetCount; i++) {
    // Randomly sample from valid pixels
    const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
    
    // Map to 3D Space (XY plane)
    // Center is (size/2, size/2) -> (0,0)
    // Scale 40 ensures it fills the view similarly to other shapes
    const x = (pixel.x - size / 2) / size * 40; 
    const y = -(pixel.y - size / 2) / size * 40; // Invert Y for correct text direction
    const z = (Math.random() - 0.5) * 2; // Flat with slight depth

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
};