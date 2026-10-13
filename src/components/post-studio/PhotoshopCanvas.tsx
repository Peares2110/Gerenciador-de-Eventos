import React, { useRef, useState, useEffect } from 'react';
import {
  PostLayer,
  CanvasDimensions,
  StrategicZone,
  PostEngineeringData
} from '../../types/postStudio';

interface PhotoshopCanvasProps {
  layers: PostLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PostLayer>) => void;
  dimensions: CanvasDimensions;
  zoom: number;
  showBlueprint: boolean;
  showHeatmap: boolean;
  showSafeZones: boolean;
  showGrid: boolean;
  engineeringData?: PostEngineeringData;
}

type DragAction =
  | { type: 'move'; startX: number; startY: number; initialLayerX: number; initialLayerY: number }
  | {
      type: 'resize';
      handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
      initialW: number;
      initialH: number;
    }
  | { type: 'rotate'; initialRotation: number; centerX: number; centerY: number }
  | null;

export const PhotoshopCanvas: React.FC<PhotoshopCanvasProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  dimensions,
  zoom,
  showBlueprint,
  showHeatmap,
  showSafeZones,
  showGrid,
  engineeringData
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [dragAction, setDragAction] = useState<DragAction>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Sync editingLayerId with selectedLayerId
  useEffect(() => {
    if (selectedLayerId !== editingLayerId) {
      setEditingLayerId(null);
    }
  }, [selectedLayerId]);

  // Global mousemove and mouseup handler for smooth dragging/resizing/rotating
  useEffect(() => {
    if (!dragAction || !selectedLayer) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Scale mouse delta by zoom factor to keep 1:1 pixel fidelity with native canvas
      const deltaX = (e.clientX - (dragAction as any).startX) / zoom;
      const deltaY = (e.clientY - (dragAction as any).startY) / zoom;

      if (dragAction.type === 'move') {
        const nextX = Math.round(dragAction.initialLayerX + deltaX);
        const nextY = Math.round(dragAction.initialLayerY + deltaY);
        onUpdateLayer(selectedLayer.id, { x: nextX, y: nextY });
      } else if (dragAction.type === 'resize') {
        let newX = dragAction.initialX;
        let newY = dragAction.initialY;
        let newW = dragAction.initialW;
        let newH = dragAction.initialH;

        const h = dragAction.handle;
        if (h.includes('e')) {
          newW = Math.max(20, Math.round(dragAction.initialW + deltaX));
        }
        if (h.includes('s')) {
          newH = Math.max(20, Math.round(dragAction.initialH + deltaY));
        }
        if (h.includes('w')) {
          const w = Math.max(20, Math.round(dragAction.initialW - deltaX));
          newX = dragAction.initialX + (dragAction.initialW - w);
          newW = w;
        }
        if (h.includes('n')) {
          const ht = Math.max(20, Math.round(dragAction.initialH - deltaY));
          newY = dragAction.initialY + (dragAction.initialH - ht);
          newH = ht;
        }

        onUpdateLayer(selectedLayer.id, {
          x: newX,
          y: newY,
          width: newW,
          height: newH
        });
      } else if (dragAction.type === 'rotate') {
        const rad = Math.atan2(e.clientY - dragAction.centerY, e.clientX - dragAction.centerX);
        let deg = Math.round((rad * 180) / Math.PI) - 90;
        if (deg < -180) deg += 360;
        if (deg > 180) deg -= 360;
        // Snap to 0, 90, 180, 270 if close
        if (Math.abs(deg) < 3) deg = 0;
        onUpdateLayer(selectedLayer.id, { rotation: deg });
      }
    };

    const handleMouseUp = () => {
      setDragAction(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragAction, selectedLayer, zoom, onUpdateLayer]);

  // Keyboard navigation / nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayer || selectedLayer.locked) return;
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { y: selectedLayer.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { y: selectedLayer.y + step });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { x: selectedLayer.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { x: selectedLayer.x + step });
      } else if (e.key === 'Escape') {
        onSelectLayer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, onUpdateLayer, onSelectLayer]);

  // Start moving a layer
  const handleLayerMouseDown = (e: React.MouseEvent, layer: PostLayer) => {
    // Only handle primary left click
    if (e.button !== 0) return;
    e.stopPropagation();

    // Select the layer immediately
    onSelectLayer(layer.id);

    if (layer.locked) {
      return;
    }

    setDragAction({
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      initialLayerX: layer.x,
      initialLayerY: layer.y
    });
  };

  // Click on a layer (stops propagation to container)
  const handleLayerClick = (e: React.MouseEvent, layer: PostLayer) => {
    e.stopPropagation();
    onSelectLayer(layer.id);
  };

  // Double click for immediate in-place editing
  const handleLayerDoubleClick = (e: React.MouseEvent, layer: PostLayer) => {
    e.stopPropagation();
    onSelectLayer(layer.id);
    if (!layer.locked && ['text', 'badge', 'button'].includes(layer.type)) {
      setEditingLayerId(layer.id);
    }
  };

  // Container click handler: only deselect if clicking outer canvas area
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target === containerRef.current ||
      target === canvasRef.current ||
      target.id === 'canvas-artboard-wrapper' ||
      target.id === 'canvas-artboard-inner'
    ) {
      onSelectLayer(null);
      setEditingLayerId(null);
    }
  };

  // Start resizing handle
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  ) => {
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.locked) return;

    setDragAction({
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: selectedLayer.x,
      initialY: selectedLayer.y,
      initialW: selectedLayer.width,
      initialH: selectedLayer.height
    });
  };

  // Start rotating handle
  const handleRotateHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.locked || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const cx = canvasRect.left + (selectedLayer.x + selectedLayer.width / 2) * zoom;
    const cy = canvasRect.top + (selectedLayer.y + selectedLayer.height / 2) * zoom;

    setDragAction({
      type: 'rotate',
      initialRotation: selectedLayer.rotation,
      centerX: cx,
      centerY: cy
    });
  };

  // Sorted layers
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const z1Height = Math.round(dimensions.height * 0.35);
  const z2Height = Math.round(dimensions.height * 0.4);
  const z3Height = dimensions.height - z1Height - z2Height;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="flex-1 h-full bg-[#16171c] overflow-auto flex items-center justify-center p-8 select-none relative"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* CANVAS ARTBOARD CONTAINER */}
      <div
        ref={canvasRef}
        id="canvas-artboard-wrapper"
        onClick={handleContainerClick}
        style={{
          width: dimensions.width * zoom,
          height: dimensions.height * zoom,
          position: 'relative'
        }}
        className="shadow-2xl shadow-black/90 ring-1 ring-white/[0.15] transition-all bg-[#090B10] overflow-hidden"
      >
        {/* INNER SCALED WRAPPER AT 1080xDIM */}
        <div
          id="canvas-artboard-inner"
          onClick={handleContainerClick}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="relative overflow-hidden"
        >
          {/* GRID OVERLAY */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-40 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #9333EA 1px, transparent 1px), linear-gradient(to bottom, #9333EA 1px, transparent 1px)',
                backgroundSize: '108px 108px'
              }}
            />
          )}

          {/* RENDER LAYERS */}
          {sortedLayers.map((layer) => {
            if (!layer.visible) return null;
            const isSelected = layer.id === selectedLayerId;
            const isBackgroundLocked =
              layer.locked &&
              (layer.zone === 'background' ||
                layer.id.includes('bg') ||
                layer.id.includes('ambient') ||
                layer.id.includes('glow'));

            return (
              <div
                key={layer.id}
                onMouseDown={(e) => handleLayerMouseDown(e, layer)}
                onClick={(e) => handleLayerClick(e, layer)}
                onDoubleClick={(e) => handleLayerDoubleClick(e, layer)}
                style={{
                  position: 'absolute',
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                  opacity: layer.opacity,
                  zIndex: layer.zIndex,
                  cursor: layer.locked ? 'default' : isSelected ? 'move' : 'pointer',
                  pointerEvents: isSelected ? 'auto' : isBackgroundLocked ? 'none' : 'auto'
                }}
                className={`group select-none ${
                  isSelected ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-transparent' : ''
                }`}
              >
                {/* LAYER CONTENT RENDERING */}
                {layer.type === 'shape' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: layer.backgroundColor,
                      borderRadius: layer.shapeType === 'circle' ? '9999px' : layer.borderRadius || 0,
                      border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor || '#ffffff'}` : undefined,
                      boxShadow: layer.shadowBlur
                        ? `${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 4}px ${layer.shadowBlur}px ${layer.shadowColor || 'rgba(0,0,0,0.5)'}`
                        : undefined
                    }}
                  />
                )}

                {layer.type === 'badge' && (
                  editingLayerId === layer.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={layer.content || ''}
                      onChange={(e) => onUpdateLayer(layer.id, { content: e.target.value })}
                      onBlur={() => setEditingLayerId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter') setEditingLayerId(null);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(15, 12, 28, 0.95)',
                        border: '2px solid #A855F7',
                        borderRadius: layer.borderRadius ?? 4,
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: `${layer.fontSize || 18}px`,
                        fontWeight: layer.fontWeight || 'bold',
                        textAlign: 'center',
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        outline: 'none',
                        padding: '0 8px',
                        boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
                      }}
                      className="z-50 select-text"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: layer.backgroundColor || 'rgba(147, 51, 234, 0.2)',
                        borderRadius: layer.borderRadius ?? 4,
                        border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor || 'rgba(255,255,255,0.2)'}` : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: layer.fontSize || 18,
                        fontWeight: layer.fontWeight || 'bold',
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        padding: '0 12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {layer.content}
                    </div>
                  )
                )}

                {layer.type === 'button' && (
                  editingLayerId === layer.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={layer.content || ''}
                      onChange={(e) => onUpdateLayer(layer.id, { content: e.target.value })}
                      onBlur={() => setEditingLayerId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter') setEditingLayerId(null);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(15, 12, 28, 0.95)',
                        border: '2px solid #A855F7',
                        borderRadius: layer.borderRadius ?? 8,
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: `${layer.fontSize || 24}px`,
                        fontWeight: layer.fontWeight || 'bold',
                        textAlign: 'center',
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        outline: 'none',
                        padding: '0 12px',
                        boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                      }}
                      className="z-50 select-text"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: layer.backgroundColor || '#7C3AED',
                        borderRadius: layer.borderRadius ?? 8,
                        border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor || '#A78BFA'}` : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: layer.fontSize || 24,
                        fontWeight: layer.fontWeight || 'bold',
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        boxShadow: layer.shadowBlur
                          ? `${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 4}px ${layer.shadowBlur}px ${layer.shadowColor || 'rgba(124, 58, 237, 0.5)'}`
                          : undefined
                      }}
                    >
                      {layer.content}
                    </div>
                  )
                )}

                {layer.type === 'text' && (
                  editingLayerId === layer.id ? (
                    <textarea
                      autoFocus
                      value={layer.content || ''}
                      onChange={(e) => onUpdateLayer(layer.id, { content: e.target.value })}
                      onBlur={() => setEditingLayerId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingLayerId(null);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: `${layer.fontSize || 36}px`,
                        fontWeight: layer.fontWeight || 'bold',
                        textAlign: layer.textAlign || 'center',
                        lineHeight: layer.lineHeight || 1.15,
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        textShadow: layer.shadowBlur
                          ? `${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 4}px ${layer.shadowBlur}px ${layer.shadowColor || 'rgba(0,0,0,0.8)'}`
                          : undefined,
                        backgroundColor: 'rgba(10, 8, 20, 0.95)',
                        border: '2px solid #A855F7',
                        borderRadius: '4px',
                        outline: 'none',
                        padding: '4px',
                        resize: 'none',
                        boxShadow: '0 0 25px rgba(168, 85, 247, 0.7)'
                      }}
                      className="z-50 select-text"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        color: layer.color || '#FFFFFF',
                        fontFamily: layer.fontFamily || 'Inter, sans-serif',
                        fontSize: layer.fontSize || 36,
                        fontWeight: layer.fontWeight || 'bold',
                        textAlign: layer.textAlign || 'center',
                        lineHeight: layer.lineHeight || 1.15,
                        letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
                        textTransform: layer.textTransform || 'uppercase',
                        textShadow: layer.shadowBlur
                          ? `${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 4}px ${layer.shadowBlur}px ${layer.shadowColor || 'rgba(0,0,0,0.8)'}`
                          : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      {layer.content?.split('\n').map((line, idx) => (
                        <span key={idx}>{line}</span>
                      ))}
                    </div>
                  )
                )}

                {layer.type === 'image' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      borderRadius: layer.borderRadius || 0
                    }}
                  >
                    {layer.imageUrl ? (
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm">
                        Imagem
                      </div>
                    )}
                  </div>
                )}

                {/* LOCKED INDICATOR OVERLAY */}
                {isSelected && layer.locked && (
                  <div className="absolute inset-0 pointer-events-none border border-amber-500/60 border-dashed flex items-start justify-end p-1 z-30">
                    <span className="bg-amber-950/90 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/40 shadow">
                      🔒 Bloqueada
                    </span>
                  </div>
                )}

                {/* BOUNDING BOX CONTROLS WHEN SELECTED & UNLOCKED */}
                {isSelected && !layer.locked && (
                  <>
                    {/* Bounding box outline */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-purple-400 border-dashed" />

                    {/* Top rotation stalk and handle */}
                    <div
                      onMouseDown={handleRotateHandleMouseDown}
                      title="Rotacionar elemento"
                      className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-400 border-2 border-white shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-900" />
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-purple-400 pointer-events-none" />

                    {/* 8 Resize Handles */}
                    {/* Top-Left */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'nw')}
                      className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-nwse-resize shadow hover:scale-125"
                    />
                    {/* Top-Center */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'n')}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-ns-resize shadow hover:scale-125"
                    />
                    {/* Top-Right */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'ne')}
                      className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-nesw-resize shadow hover:scale-125"
                    />
                    {/* Middle-Right */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'e')}
                      className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-ew-resize shadow hover:scale-125"
                    />
                    {/* Bottom-Right */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'se')}
                      className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-nwse-resize shadow hover:scale-125"
                    />
                    {/* Bottom-Center */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 's')}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-ns-resize shadow hover:scale-125"
                    />
                    {/* Bottom-Left */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'sw')}
                      className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-nesw-resize shadow hover:scale-125"
                    />
                    {/* Middle-Left */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, 'w')}
                      className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-purple-600 rounded-sm cursor-ew-resize shadow hover:scale-125"
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* BLUEPRINT 3-ZONE OVERLAYS */}
          {showBlueprint && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {/* Zone 1: Hook */}
              <div
                style={{ top: 0, height: z1Height, width: '100%' }}
                className="absolute border-b-2 border-purple-500/80 bg-purple-900/10 p-4 flex flex-col justify-between"
              >
                <div className="inline-flex items-center gap-2 bg-purple-950/90 border border-purple-400 text-purple-200 px-3 py-1 rounded font-mono text-sm font-bold w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  ZONA 1: GANCHO VISUAL (35%) · INTERRUPÇÃO EM &lt; 300MS
                </div>
                <div className="text-right text-xs font-mono text-purple-300/80">
                  Hook Eyebrow + Headline de Impacto
                </div>
              </div>

              {/* Zone 2: Proof */}
              <div
                style={{ top: z1Height, height: z2Height, width: '100%' }}
                className="absolute border-b-2 border-amber-500/80 bg-amber-950/10 p-4 flex flex-col justify-between"
              >
                <div className="inline-flex items-center gap-2 bg-amber-950/90 border border-amber-400 text-amber-200 px-3 py-1 rounded font-mono text-sm font-bold w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  ZONA 2: PROVA DE LINEUP & AUTORIDADE (40%) · ANCORAGEM DE VALOR
                </div>
                <div className="text-right text-xs font-mono text-amber-300/80">
                  Headliners + Selo de Autoridade + Lineup Suporte
                </div>
              </div>

              {/* Zone 3: CTA */}
              <div
                style={{ top: z1Height + z2Height, height: z3Height, width: '100%' }}
                className="absolute bg-emerald-950/10 p-4 flex flex-col justify-between border-t border-emerald-500/40"
              >
                <div className="inline-flex items-center gap-2 bg-emerald-950/90 border border-emerald-400 text-emerald-200 px-3 py-1 rounded font-mono text-sm font-bold w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  ZONA 3: CTA & CONVERSÃO (25%) · AÇÃO IMEDIATA
                </div>
                <div className="text-right text-xs font-mono text-emerald-300/80">
                  Gatilho de Urgência + Botão Gandaya + Data/Local
                </div>
              </div>
            </div>
          )}

          {/* HEATMAP ATTENTION RADIANCE OVERLAY */}
          {showHeatmap && engineeringData?.heatmap && (
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen opacity-70">
              {/* Primary Hotspot (Lineup / Center) */}
              <div
                style={{
                  top: `${engineeringData.heatmap.primaryHotspot.y}%`,
                  left: `${engineeringData.heatmap.primaryHotspot.x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '420px',
                  height: '420px',
                  background:
                    'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(245,158,11,0.55) 40%, rgba(59,130,246,0.15) 70%, transparent 100%)'
                }}
                className="absolute rounded-full filter blur-xl animate-pulse"
              />

              {/* Secondary Hotspot (CTA / Bottom) */}
              <div
                style={{
                  top: `${engineeringData.heatmap.secondaryHotspot.y}%`,
                  left: `${engineeringData.heatmap.secondaryHotspot.x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '380px',
                  height: '380px',
                  background:
                    'radial-gradient(circle, rgba(245,158,11,0.9) 0%, rgba(16,185,129,0.5) 45%, transparent 80%)'
                }}
                className="absolute rounded-full filter blur-xl"
              />

              {/* Entry Hotspot (Hook / Top) */}
              <div
                style={{
                  top: `${engineeringData.heatmap.entryHotspot.y}%`,
                  left: `${engineeringData.heatmap.entryHotspot.x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '340px',
                  height: '340px',
                  background:
                    'radial-gradient(circle, rgba(147,51,234,0.8) 0%, rgba(239,68,68,0.45) 45%, transparent 80%)'
                }}
                className="absolute rounded-full filter blur-xl"
              />

              {/* Eye-Flow Pattern Vector Indicator */}
              <div className="absolute top-8 right-8 bg-black/80 border border-amber-400 text-amber-300 px-4 py-2 rounded font-mono text-xs shadow-xl backdrop-blur-md">
                <span className="font-bold">FLUXO OCULAR: </span>
                {engineeringData.heatmap.eyeTrackingFlow}
              </div>
            </div>
          )}

          {/* INSTAGRAM SAFE-ZONE OVERLAY */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {/* Top exclusion margin */}
              <div
                style={{ height: dimensions.height === 1920 ? 180 : 60 }}
                className="w-full bg-red-500/20 border-b border-red-500/60 flex items-center justify-center font-mono text-xs text-red-200"
              >
                SAFE-ZONE SUPERIOR (Avatar / Barra de Stories / Menu)
              </div>

              {/* Bottom exclusion margin */}
              <div
                style={{
                  bottom: 0,
                  height: dimensions.height === 1920 ? 220 : 60
                }}
                className="absolute w-full bg-red-500/20 border-t border-red-500/60 flex items-center justify-center font-mono text-xs text-red-200"
              >
                SAFE-ZONE INFERIOR (Barra de Mensagem / Direct / Ações)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
