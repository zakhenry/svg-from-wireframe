import { Vector2 } from '@babylonjs/core';
import { LineSegment } from './interfaces';
import { ScreenSpaceLines } from './mesh-to-screen-space';


export function screenSpaceLinesToFittedSvg(screenSpaceLines: ScreenSpaceLines, width = 800, height = 600, margin = 100): SVGSVGElement {

  const { obscured, visible, silhouette } = screenSpaceLines;

  const allLines = obscured.concat(visible, silhouette);

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
    silhouette: silhouette.map(line => line.map(point => point.subtract(halfViewport).scale(scale).add(halfCanvas))),
  };

  return screenSpaceLinesToSvg(scaledPoints as ScreenSpaceLines, width, height);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function createLineElement(line: LineSegment): SVGLineElement {
  const [start, end] = line;
  const lineElement = document.createElementNS(SVG_NS, 'line');
  lineElement.setAttribute('x1', start.x.toString());
  lineElement.setAttribute('y1', start.y.toString());
  lineElement.setAttribute('x2', end.x.toString());
  lineElement.setAttribute('y2', end.y.toString());
  return lineElement;
}

export function screenSpaceLinesToSvg(screenSpaceLines: ScreenSpaceLines, width: number, height: number): SVGSVGElement {
  const { obscured, visible, silhouette } = screenSpaceLines;

  const svg = document.createElementNS(SVG_NS, 'svg');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', SVG_NS);

  const visibleGroup = document.createElementNS(SVG_NS, 'g');
  visibleGroup.id = 'visible';
  const obscuredGroup = document.createElementNS(SVG_NS, 'g');
  obscuredGroup.id = 'obscured';
  const silhouetteGroup = document.createElementNS(SVG_NS, 'g');
  silhouetteGroup.id = 'silhouette';

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

  silhouette.forEach((line) => {
    const lineElement = createLineElement(line);
    lineElement.setAttribute('stroke', 'red');
    lineElement.setAttribute('stroke-width', '3');
    silhouetteGroup.append(lineElement);
  });

  svg.appendChild(obscuredGroup);
  svg.appendChild(visibleGroup);
  svg.appendChild(silhouetteGroup);

  return svg;
}
