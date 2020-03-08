import { Vector2 } from '@babylonjs/core';
import { LineSegment } from './interfaces';
import { ScreenSpaceLines } from './mesh-to-screen-space';

export function screenSpaceLinesToFittedSvg(
  screenSpaceLines: ScreenSpaceLines,
  width = 800,
  height = 600,
  margin = 100,
): string {
  const { obscured, visible } = screenSpaceLines;

  const allLines = obscured.concat(visible);

  const minBound: Vector2 = allLines[0][0].clone();
  const maxBound: Vector2 = allLines[0][0].clone();

  allLines.forEach(line => {
    line.forEach(point => {
      minBound.x = Math.min(point.x, minBound.x);
      minBound.y = Math.min(point.y, minBound.y);

      maxBound.x = Math.max(point.x, maxBound.x);
      maxBound.y = Math.max(point.y, maxBound.y);
    });
  });

  const marginVec = new Vector2(margin, margin);

  const canvas = new Vector2(width, height).subtract(marginVec);

  const viewport = maxBound.subtract(minBound);
  const halfViewport = viewport.scale(0.5).add(minBound);
  const halfCanvas = canvas.scale(0.5).add(marginVec.scale(0.5));

  const xScale = canvas.x / viewport.x;
  const yScale = canvas.y / viewport.y;
  const scale = Math.min(xScale, yScale);

  const scaledPoints = {
    obscured: obscured.map(line =>
      line.map(point =>
        point
          .subtract(halfViewport)
          .scale(scale)
          .add(halfCanvas),
      ),
    ),
    visible: visible.map(line =>
      line.map(point =>
        point
          .subtract(halfViewport)
          .scale(scale)
          .add(halfCanvas),
      ),
    ),
  };

  return screenSpaceLinesToSvg(scaledPoints as ScreenSpaceLines, width, height);
}

function createPathElement(lines: LineSegment[], stroke: string, strokeWidth: number): string {
  let pathDef = '';
  let current: Vector2 = null;
  lines.forEach(([start, end], i) => {
    if (current && current.equalsWithEpsilon(start)) {
      pathDef += 'L ';
    } else {
      pathDef += `M ${start.x} ${start.y} `;
    }
    pathDef += `${end.x} ${end.y}`;

    current = end;
  });

  return `<path d="${pathDef}" stroke="${stroke}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
}

export function screenSpaceLinesToSvg(screenSpaceLines: ScreenSpaceLines, width: number, height: number): string {
  const { obscured, visible } = screenSpaceLines;

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${createPathElement(obscured, 'lightgrey', 1)}
  ${createPathElement(visible, 'black', 2)}
</svg>`;
}
