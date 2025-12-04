
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandData, HandTrackerProps } from '../types';

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, showCamera }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null); // New offscreen canvas for mirroring
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setHandLandmarker(landmarker);
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
      }
    };
    initLandmarker();
  }, []);

  // Initialize Webcam
  useEffect(() => {
    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: 640, 
              height: 480,
              facingMode: "user" 
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
          }
        } catch (error) {
          console.error("Error accessing webcam:", error);
        }
      }
    };

    startWebcam();

    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handLandmarker]);

  const predictWebcam = () => {
    if (!handLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    // Match canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Prepare offscreen canvas for mirroring the input
    if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    if (offCanvas.width !== video.videoWidth || offCanvas.height !== video.videoHeight) {
        offCanvas.width = video.videoWidth;
        offCanvas.height = video.videoHeight;
    }

    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    
    let result = { landmarks: [] as any[] };
    const startTimeMs = performance.now();

    if (offCtx) {
        // Mirror the image: Flip horizontally
        offCtx.save();
        offCtx.translate(offCanvas.width, 0);
        offCtx.scale(-1, 1);
        offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
        offCtx.restore();

        // Perform detection on the MIRRORED image
        // We cast to any because detectForVideo officially expects HTMLVideoElement but works with Canvas
        result = handLandmarker.detectForVideo(offCanvas as any, startTimeMs);
    }

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw landmarks if visible
      if (showCamera && result.landmarks) {
        for (const landmarks of result.landmarks) {
          drawLandmarks(ctx, landmarks);
        }
      }
    }

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      const wrist = landmarks[0];

      // Calculate Grip Strength (Continuous 0 to 1)
      const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
      
      // Tips & MCPs
      const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
      const mcps = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
      
      let totalOpenness = 0;
      for (let i = 0; i < 4; i++) {
        const dTip = dist(wrist, tips[i]);
        const dMcp = dist(wrist, mcps[i]);
        totalOpenness += (dTip / dMcp);
      }
      const avgRatio = totalOpenness / 4;
      
      // Map Ratio to 0-1. Fist=1, Open=0.
      let strength = 1 - (avgRatio - 1.0) / 1.2;
      strength = Math.max(0, Math.min(1, strength));

      // 3D Rotation (Roll) with Aspect Ratio Correction
      const aspectRatio = video.videoWidth / video.videoHeight;
      const middleBase = landmarks[9];
      
      // Adjust X delta by aspect ratio to get true angle in screen space
      // Since input is mirrored, x axis is consistent with screen.
      const deltaX = (middleBase.x - wrist.x) * aspectRatio;
      const deltaY = middleBase.y - wrist.y;
      
      // Rotation logic
      const rotationZ = Math.atan2(deltaY, deltaX);

      // Position - Mapping Logic
      // Input is now mirrored (0 is left, 1 is right).
      // We map 0..1 to -1..1 directly.
      const x = (wrist.x - 0.5) * 2; 
      // Y is inverted (0 is top in video, +1 is top in 3D usually, or we match screen logic)
      // Screen: 0 top. 3D: +Y up.
      // wrist.y * 2 - 1 maps 0->-1 (bottom), 1->1 (top)? No.
      // 0 -> -1. 1 -> 1.
      // If we want top of screen to be top of 3D, we negate.
      const y = -(wrist.y * 2 - 1); 

      // Scale Calculation
      const handSize = dist(wrist, middleBase);
      const referenceSize = 0.15;
      const scale = Math.max(0.5, Math.min(3.0, handSize / referenceSize));

      onHandUpdate({
        isPresent: true,
        gripStrength: strength,
        position: { x, y, z: 0 },
        rotation: { x: 0, y: 0, z: -rotationZ - Math.PI/2 },
        pinchDistance: dist(landmarks[4], landmarks[8]),
        scale: scale
      });
    } else {
      onHandUpdate({
        isPresent: false,
        gripStrength: 0,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        pinchDistance: 1,
        scale: 1
      });
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    ctx.fillStyle = "#00FF00";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    for (const point of landmarks) {
      // Coordinate transformation for Drawing on the Preview Canvas
      // The Preview Canvas has CSS `transform: scale-x-[-1]`.
      // The MediaPipe input was the Mirrored image.
      // If MediaPipe sees a point at X=0.9 (Right), it returns 0.9.
      // If we draw at 0.9 on a flipped canvas, visually it appears at 0.1 (Left).
      // We want it to appear at 0.9 (Right).
      // So we must draw at logical 0.1.
      // Formula: drawX = (1 - point.x).
      const x = (1 - point.x) * ctx.canvas.width;
      const y = point.y * ctx.canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${showCamera ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 w-48 h-36 md:w-64 md:h-48 bg-black">
        {/* Mirror the video element to act like a mirror */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]"
          autoPlay
          playsInline
          muted
        />
        {/* Mirror the canvas to match the video */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]"
        />
        <div className="absolute bottom-1 left-2 text-[10px] text-white/70 font-mono">
           MediaPipe Hand Tracking
        </div>
      </div>
    </div>
  );
};

export default HandTracker;
