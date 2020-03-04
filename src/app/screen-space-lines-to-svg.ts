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

export function screenSpaceLinesToSvg(screenSpaceLines: ScreenSpaceLines, width: number, height: number): SVGSVGElement {
  const {obscured, visible} = screenSpaceLines;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

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
