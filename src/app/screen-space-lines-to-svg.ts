import { Vector2 } from '@babylonjs/core';
import { LineSegment } from './interfaces';
import { ScreenSpaceLines } from './mesh-to-screen-space';


export function screenSpaceLinesToFittedSvg(screenSpaceLines: ScreenSpaceLines, width = 800, height = 600, margin = 100): SVGSVGElement {

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
    obscured: obscured.map(line => line.map(point => point.subtract(halfViewport).scale(scale).add(halfCanvas))),
    visible: visible.map(line => line.map(point => point.subtract(halfViewport).scale(scale).add(halfCanvas))),
  };

  return screenSpaceLinesToSvg(scaledPoints as ScreenSpaceLines, width, height);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function createPathElement(lines: LineSegment[], stroke: string, strokeWidth: number): SVGPathElement {

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

  const pathElement = document.createElementNS(SVG_NS, 'path');
  pathElement.setAttribute('d', pathDef);
  pathElement.setAttribute('stroke', stroke);
  pathElement.setAttribute('fill', 'none');
  pathElement.setAttribute('stroke-width', strokeWidth.toString());
  pathElement.setAttribute('stroke-width', strokeWidth.toString());
  pathElement.setAttribute('stroke-linecap', 'round');
  return pathElement;
}

export function screenSpaceLinesToSvg(screenSpaceLines: ScreenSpaceLines, width: number, height: number): SVGSVGElement {
  const { obscured, visible } = screenSpaceLines;

  const svg = document.createElementNS(SVG_NS, 'svg');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', SVG_NS);

  svg.appendChild(createPathElement(obscured, 'lightgrey', 1));
  svg.appendChild(createPathElement(visible, 'black', 2));

  return svg;
}
