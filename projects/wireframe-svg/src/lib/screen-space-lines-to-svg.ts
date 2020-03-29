import { SvgConfig, SvgLineConfig } from './external-interfaces';
import { LineSegment } from './interfaces';
import { Vector2 } from './Maths/vector';
import { ScreenSpaceLines } from './mesh-to-screen-space';

export function screenSpaceLinesToFittedSvg(screenSpaceLines: ScreenSpaceLines, svgConfig?: SvgConfig): string {
  const width = svgConfig?.width ?? 800;
  const height = svgConfig?.height ?? 600;
  const margin = svgConfig?.margin ?? 100;
  const visibleLine = svgConfig?.visible ?? { color: 'black', strokeWidth: 4 };
  const occludedLine = svgConfig ? svgConfig.occluded : { color: 'lightgrey', strokeWidth: 1 };

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

  return screenSpaceLinesToSvg(scaledPoints as ScreenSpaceLines, width, height, visibleLine, occludedLine);
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

export function screenSpaceLinesToSvg(
  screenSpaceLines: ScreenSpaceLines,
  width: number,
  height: number,
  visibleConfig: SvgLineConfig,
  occludedConfig: SvgLineConfig | null,
): string {
  const { obscured, visible } = screenSpaceLines;

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${occludedConfig ? createPathElement(obscured, occludedConfig.color, occludedConfig.strokeWidth) : ''}
  ${createPathElement(visible, visibleConfig.color, visibleConfig.strokeWidth)}
</svg>`;
}
