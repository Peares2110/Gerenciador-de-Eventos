import { PostLayer, CanvasDimensions } from '../types/postStudio';

/**
 * Render all visible layers onto an offscreen HTML5 Canvas and trigger high-res PNG download.
 */
export async function exportCanvasToPng(
  layers: PostLayer[],
  dimensions: CanvasDimensions,
  filename: string = 'arte-engenharia-post.png'
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D do Canvas');
  }

  // Pre-load all images if any
  const imageMap = new Map<string, HTMLImageElement>();
  const imagePromises: Promise<void>[] = [];

  for (const layer of layers) {
    if (layer.visible && layer.type === 'image' && layer.imageUrl) {
      const p = new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageMap.set(layer.imageUrl!, img);
          resolve();
        };
        img.onerror = () => {
          console.warn('Erro ao carregar imagem para canvas:', layer.imageUrl);
          resolve();
        };
        img.src = layer.imageUrl!;
      });
      imagePromises.push(p);
    }
  }

  await Promise.all(imagePromises);

  // Clear canvas
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);

  // Default deep dark background
  ctx.fillStyle = '#090B10';
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Sort layers by zIndex ascending
  const sortedLayers = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    ctx.save();

    // Opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity ?? 1));

    // Center point for rotation
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;

    ctx.translate(cx, cy);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.translate(-cx, -cy);

    // Apply drop shadow if configured
    if (layer.shadowBlur && layer.shadowBlur > 0) {
      ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = layer.shadowBlur;
      ctx.shadowOffsetX = layer.shadowOffsetX || 0;
      ctx.shadowOffsetY = layer.shadowOffsetY || 4;
    }

    if (layer.type === 'image' && layer.imageUrl) {
      const img = imageMap.get(layer.imageUrl);
      if (img) {
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
      } else {
        // Fallback stylized dark card
        ctx.fillStyle = layer.backgroundColor || '#141417';
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
      }
    } else if (layer.type === 'shape') {
      ctx.fillStyle = layer.backgroundColor || '#1e1b4b';
      if (layer.shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(layer.width, layer.height) / 2, 0, Math.PI * 2);
        ctx.fill();
        if (layer.borderWidth && layer.borderWidth > 0) {
          ctx.strokeStyle = layer.borderColor || '#ffffff';
          ctx.lineWidth = layer.borderWidth;
          ctx.stroke();
        }
      } else {
        const radius = layer.borderRadius || 0;
        roundRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
        ctx.fill();
        if (layer.borderWidth && layer.borderWidth > 0) {
          ctx.strokeStyle = layer.borderColor || '#ffffff';
          ctx.lineWidth = layer.borderWidth;
          ctx.stroke();
        }
      }
    } else if (layer.type === 'badge' || layer.type === 'button') {
      // Draw background
      ctx.fillStyle = layer.backgroundColor || (layer.type === 'button' ? '#9333EA' : 'rgba(255,255,255,0.08)');
      const radius = layer.borderRadius ?? (layer.type === 'button' ? 8 : 4);
      roundRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
      ctx.fill();

      // Border
      if (layer.borderWidth && layer.borderWidth > 0) {
        ctx.strokeStyle = layer.borderColor || 'rgba(255,255,255,0.2)';
        ctx.lineWidth = layer.borderWidth;
        ctx.stroke();
      }

      // Text inside badge / button
      if (layer.content) {
        ctx.shadowColor = 'transparent'; // reset shadow for text unless wanted
        ctx.fillStyle = layer.color || '#FFFFFF';
        const fontSize = layer.fontSize || (layer.type === 'button' ? 32 : 20);
        const fontWeight = layer.fontWeight || (layer.type === 'button' ? 'bold' : '600');
        const fontFamily = layer.fontFamily || 'Inter, sans-serif';
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = layer.textTransform === 'uppercase' ? layer.content.toUpperCase() : layer.content;
        ctx.fillText(text, cx, cy);
      }
    } else if (layer.type === 'text') {
      if (layer.backgroundColor) {
        ctx.fillStyle = layer.backgroundColor;
        const radius = layer.borderRadius || 0;
        roundRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
        ctx.fill();
      }

      if (layer.content) {
        ctx.fillStyle = layer.color || '#FFFFFF';
        const fontSize = layer.fontSize || 36;
        const fontWeight = layer.fontWeight || 'bold';
        const fontFamily = layer.fontFamily || 'Inter, sans-serif';
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textBaseline = 'top';

        const align = layer.textAlign || 'center';
        ctx.textAlign = align;

        let drawX = cx;
        if (align === 'left') drawX = layer.x + (layer.padding || 8);
        if (align === 'right') drawX = layer.x + layer.width - (layer.padding || 8);

        const lines = layer.content.split('\n');
        const lineHeight = layer.lineHeight ? layer.lineHeight * fontSize : fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        let startY = layer.y + Math.max(0, (layer.height - totalTextHeight) / 2);

        lines.forEach((line, index) => {
          const textToRender = layer.textTransform === 'uppercase' ? line.toUpperCase() : line;
          ctx.fillText(textToRender, drawX, startY + index * lineHeight);
        });
      }
    }

    ctx.restore();
  }

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = dataUrl;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
