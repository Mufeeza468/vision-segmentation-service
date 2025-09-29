import { SegmentationMask, BoundingBox } from '../models/types';

export function calculateMaskArea(mask: SegmentationMask): number {
  switch (mask.format) {
    case 'rle':
      return calculateRLEArea(mask);
    case 'polygon':
      return calculatePolygonArea(mask);
    case 'bitmap':
      return calculateBitmapArea(mask);
    default:
      throw new Error(`Unsupported mask format: ${mask.format}`);
  }
}

export function calculateBoundingBox(mask: SegmentationMask): BoundingBox {
  switch (mask.format) {
    case 'rle':
      return calculateRLEBoundingBox(mask);
    case 'polygon':
      return calculatePolygonBoundingBox(mask);
    case 'bitmap':
      return calculateBitmapBoundingBox(mask);
    default:
      throw new Error(`Unsupported mask format: ${mask.format}`);
  }
}

function calculateRLEArea(mask: SegmentationMask): number {
  if (mask.format !== 'rle') {
    throw new Error('Invalid mask format for RLE calculation');
  }
  
  const { counts } = mask.data as { size: number[]; counts: string };
  
  // RLE format alternates between 0s and 1s, starting with 0s
  // We need to sum up all the runs that represent 1s (positive pixels)
  let area = 0;
  let isPositive = false; // RLE starts with zeros
  
  // Simple RLE decoder - in practice, you'd use a proper RLE library
  const runs = counts.split(',').map(Number);
  for (const run of runs) {
    if (isPositive) {
      area += run;
    }
    isPositive = !isPositive;
  }
  
  return area;
}

function calculatePolygonArea(mask: SegmentationMask): number {
  if (mask.format !== 'polygon') {
    throw new Error('Invalid mask format for polygon calculation');
  }
  
  const { exterior, holes } = mask.data as {
    exterior: number[][];
    holes?: number[][][];
  };
  
  let area = shoelaceArea(exterior);
  
  // Subtract hole areas
  if (holes) {
    for (const hole of holes) {
      area -= shoelaceArea(hole);
    }
  }
  
  return Math.abs(area);
}

function shoelaceArea(points: number[][]): number {
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i]![0]! * points[j]![1]!;
    area -= points[j]![0]! * points[i]![1]!;
  }
  
  return Math.abs(area) / 2;
}

function calculateBitmapArea(mask: SegmentationMask): number {
  if (mask.format !== 'bitmap') {
    throw new Error('Invalid mask format for bitmap calculation');
  }
  
  const { mask: bitmap } = mask.data as { mask: number[][] };
  let area = 0;
  
  for (const row of bitmap) {
    for (const pixel of row) {
      if (pixel > 0) {
        area++;
      }
    }
  }
  
  return area;
}

function calculateRLEBoundingBox(mask: SegmentationMask): BoundingBox {
  // This is a simplified implementation
  // In practice, you'd decode the RLE to find the actual bounds
  return {
    x: 0,
    y: 0,
    width: mask.width,
    height: mask.height
  };
}

function calculatePolygonBoundingBox(mask: SegmentationMask): BoundingBox {
  if (mask.format !== 'polygon') {
    throw new Error('Invalid mask format for polygon bounding box calculation');
  }
  
  const { exterior } = mask.data as {
    exterior: number[][];
    holes?: number[][][];
  };
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const [x, y] of exterior) {
    minX = Math.min(minX, x!);
    minY = Math.min(minY, y!);
    maxX = Math.max(maxX, x!);
    maxY = Math.max(maxY, y!);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function calculateBitmapBoundingBox(mask: SegmentationMask): BoundingBox {
  if (mask.format !== 'bitmap') {
    throw new Error('Invalid mask format for bitmap bounding box calculation');
  }
  
  const { mask: bitmap } = mask.data as { mask: number[][] };
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (let y = 0; y < bitmap.length; y++) {
    for (let x = 0; x < bitmap[y]!.length; x++) {
      if (bitmap[y]![x]! > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}