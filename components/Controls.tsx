
import React from 'react';
import { ParticleConfig, ShapeType } from '../types';
import { Sliders, Type, Grid, Palette, RefreshCw, Eye, EyeOff, RotateCw } from 'lucide-react';

interface ControlsProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  showCamera: boolean;
  setShowCamera: (v: boolean) => void;
  reset: () => void;
}

const Controls: React.FC<ControlsProps> = ({ config, setConfig, showCamera, setShowCamera, reset }) => {
  
  const shapes = [
    { id: ShapeType.RANDOM, label: '混沌 (Chaos)' },
    { id: ShapeType.SPHERE, label: '球体 (Sphere)' },
    { id: ShapeType.CUBE, label: '立方 (Cube)' },
    { id: ShapeType.HELIX, label: '螺旋 (DNA)' },
    { id: ShapeType.RAIN, label: '雨滴 (Rain)' },
    { id: ShapeType.STAR, label: '星辰 (Star)' },
    { id: ShapeType.FIRE, label: '火焰 (Fire)' },
    { id: ShapeType.TREE, label: '圣诞树 (Tree)' },
    { id: ShapeType.FLOWER, label: '花朵 (Flower)' },
    { id: ShapeType.BUTTERFLY, label: '蝴蝶 (Butterfly)' },
  ];

  return (
    <div className="absolute top-4 left-4 z-40 w-80 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Particle Morph 3D
        </h1>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowCamera(!showCamera)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={showCamera ? "关闭摄像头" : "开启摄像头"}
            >
                {showCamera ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button 
                onClick={reset}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="重置"
            >
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      {/* Shape Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
          <Grid size={16} />
          <span>粒子模型 (Models)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((s) => (
            <button
              key={s.id}
              onClick={() => setConfig({ ...config, shape: s.id })}
              className={`text-xs py-2 px-1 rounded-lg border transition-all duration-200 ${
                config.shape === s.id
                  ? 'bg-blue-600/50 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-300">
            <Type size={16} />
            <span>文字模式 (Text)</span>
        </div>
        <div className="flex gap-2">
             <input
                type="text"
                value={config.textInput}
                onChange={(e) => setConfig({ ...config, textInput: e.target.value.substring(0, 12), shape: ShapeType.TEXT })}
                onClick={() => setConfig({...config, shape: ShapeType.TEXT})}
                className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${config.shape === ShapeType.TEXT ? 'border-blue-500 text-white' : 'border-white/10 text-gray-400'}`}
                placeholder="输入文字..."
             />
        </div>
      </div>

      {/* Sliders */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-300">
            <Sliders size={16} />
            <span>属性调节 (Attributes)</span>
        </div>
        
        {/* Count */}
        <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>粒子数量 (Count)</span>
                <span>{config.count}</span>
            </div>
            <input
                type="range"
                min="1000"
                max="15000"
                step="1000"
                value={config.count}
                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>

        {/* Size */}
        <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>大小 (Size)</span>
                <span>{config.size.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={config.size}
                onChange={(e) => setConfig({ ...config, size: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>

        {/* Speed */}
        <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>速度 (Speed)</span>
                <span>{config.speed.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>

        {/* Rotation Offsets */}
        <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-1 mb-2 text-sm font-medium text-gray-300">
                <RotateCw size={14} />
                <span>初始角度 (Initial Rotation)</span>
            </div>
            
            {/* X */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>X 轴 (X-Axis)</span>
                    <span>{config.rotationOffsets.x}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.rotationOffsets.x}
                    onChange={(e) => setConfig({ ...config, rotationOffsets: { ...config.rotationOffsets, x: parseInt(e.target.value) } })}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>
            
            {/* Y */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Y 轴 (Y-Axis)</span>
                    <span>{config.rotationOffsets.y}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.rotationOffsets.y}
                    onChange={(e) => setConfig({ ...config, rotationOffsets: { ...config.rotationOffsets, y: parseInt(e.target.value) } })}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>

            {/* Z */}
            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Z 轴 (Z-Axis)</span>
                    <span>{config.rotationOffsets.z}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.rotationOffsets.z}
                    onChange={(e) => setConfig({ ...config, rotationOffsets: { ...config.rotationOffsets, z: parseInt(e.target.value) } })}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
            <Palette size={16} />
            <span>颜色 (Color)</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                <button
                    key={c}
                    onClick={() => setConfig({...config, color: c})}
                    className={`w-6 h-6 rounded-full border transition-transform ${config.color === c ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
             <input 
                type="color" 
                value={config.color}
                onChange={(e) => setConfig({...config, color: e.target.value})}
                className="w-6 h-6 rounded-full overflow-hidden border-0 p-0 cursor-pointer bg-transparent"
            />
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-white/10 text-[10px] text-gray-500 leading-relaxed">
        <p><strong className="text-gray-300">操作指南 (Guide):</strong></p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
            <li>在摄像头前展示手部。</li>
            <li><strong>张开手掌:</strong> 粒子趋于静止/离散分布 (Wait/Disperse)。</li>
            <li><strong>握紧拳头:</strong> 聚合成选定形状 (Gather)。</li>
            <li><strong>旋转拳头:</strong> 旋转 3D 图形 (Rotate)。</li>
            <li><strong>前后移动:</strong> 缩放图形 (Zoom)。</li>
        </ul>
      </div>

    </div>
  );
};

export default Controls;
