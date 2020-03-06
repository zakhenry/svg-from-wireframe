import { Vector2 } from '@babylonjs/core';
import { LineSegment } from './interfaces';
import { ScreenSpaceLines } from './mesh-to-screen-space';

function createLineElement(line: LineSegment): SVGLineElement {
  const [start, end] = line;
  const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  lineElement.setAttribute('x1', start.x.toString());
  lineElement.setAttribute('y1', start.y.toString());
  lineElement.setAttribute('x2', end.x.toString());
  lineElement.setAttribute('y2', end.y.toString());
  return lineElement;
}

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

export function screenSpaceLinesToSvg(screenSpaceLines: ScreenSpaceLines, width: number, height: number): SVGSVGElement {
  const { obscured, visible } = screenSpaceLines;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const visibleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  visibleGroup.id = 'visible';
  const obscuredGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  obscuredGroup.id = 'obscured';

  obscured.forEach((line) => {
    const lineElement = createLineElement(line);
    lineElement.setAttribute('stroke', 'lightgrey');
    lineElement.setAttribute('stroke-width', '1');
    obscuredGroup.append(lineElement);
  });

  visible.forEach((line) => {
    const lineElement = createLineElement(line);
    lineElement.setAttribute('stroke', 'black');
    lineElement.setAttribute('stroke-width', '2');
    visibleGroup.append(lineElement);
  });

  svg.appendChild(obscuredGroup);
  svg.appendChild(visibleGroup);

  return svg;
}
