import { Matrix, Ray, Vector2, Vector3, Viewport } from '@babylonjs/core';
import { getIntersectionPointFast } from './compute-intersection';
import { dedupeLines } from './dedupe-lines';
import { LineSegment } from './interfaces';

export interface ScreenSpaceLines {
  obscured: LineSegment[];
  visible: LineSegment[];
}

export type OcclusionTest = (finiteLengthRay: Ray) => boolean;

export function viewSpaceLinesToScreenSpaceLines(
  lines: [Vector3, Vector3][],
  meshWorldMatrix: Matrix,
  sceneTransformMatrix: Matrix,
  sceneViewMatrix: Matrix,
  sceneProjectionMatrix: Matrix,
  viewport: Viewport,
  width: number, height: number,
  isObscured: OcclusionTest,
): ScreenSpaceLines {
  const identity = Matrix.Identity()

  const projectedLines = lines.map((viewSpace, i) => {

    const screenSpace = viewSpace.map((v, j) => {

      const coordinates = Vector3.Project(v, meshWorldMatrix, sceneTransformMatrix, viewport);

      return new Vector2(
        width * coordinates.x,
        height * coordinates.y,
      );
    }) as LineSegment;

    return { screenSpace, viewSpace };

  }).filter((line, i, allLines) => dedupeLines(line.screenSpace, i, allLines.map(l => l.screenSpace)));

  const intersectionsMap: Map<number, Vector2[]> = new Map();

  // eep, this is O(N^2)
  for (let b = 0; b < projectedLines.length; b++) {

    for (let a = b + 1; a < projectedLines.length; a++) {

      const lineA = projectedLines[a].screenSpace;
      const lineB = projectedLines[b].screenSpace;

      const intersection = getIntersectionPointFast(lineA, lineB);

      if (intersection) {
        [a, b].forEach(p => {
          if (!intersectionsMap.has(p)) {
            intersectionsMap.set(p, []);
          }
          intersectionsMap.get(p).push(intersection);
        });
      }

    }

  }

  const culled = projectedLines.flatMap((projected, index) => {

    const line = projected.screenSpace;

    const screenSpaceDistance = Vector2.Distance(line[0], line[1]);

    const sortedIntersections = !intersectionsMap.has(index) ? [] : intersectionsMap.get(index).map(point => {
      return {
        point, distance: Vector2.Distance(line[0], point),
      };
    })
      .sort((a, b) => a.distance - b.distance);

    const candidateNodes = [
      { distance: 0, point: line[0] },
      ...sortedIntersections,
      { distance: screenSpaceDistance, point: line[1] },
    ];

    let currentObscured = null;

    const results: Array<{ obscured: boolean, line: LineSegment }> = [];

    let currentCandidate = [candidateNodes[0], candidateNodes[1]];

    candidateNodes.forEach((node, i, allNodes) => {

      if (i === allNodes.length - 1) {
        return;
      }

      const testLine = [node, allNodes[i + 1]];

      const startScale = testLine[0].distance / screenSpaceDistance;
      const endScale = testLine[1].distance / screenSpaceDistance;
      const scale = endScale - (endScale - startScale) / 2;

      const testPointScreenSpace = Vector2.Lerp(testLine[0].point, testLine[1].point, scale);
      const testPointViewSpace = Vector3.Lerp(projected.viewSpace[0], projected.viewSpace[1], scale);

      const start = Vector3.Unproject(
        new Vector3(testPointScreenSpace.x, testPointScreenSpace.y, 0),
        width,
        height,
        identity,
        sceneViewMatrix,
        sceneProjectionMatrix,
      );

      const ray = Ray.CreateNewFromTo(start, Vector3.TransformCoordinates(testPointViewSpace, meshWorldMatrix));

      const obscured = isObscured(ray);

      if (currentObscured === null) {
        currentObscured = obscured;
      }

      if (obscured === currentObscured) {
        // extend current candidate
        currentCandidate[1] = testLine[1];
      } else {
        results.push({ line: [currentCandidate[0].point, currentCandidate[1].point], obscured: currentObscured });
        currentObscured = obscured;
        currentCandidate = testLine;
      }

    });

    results.push({ line: [currentCandidate[0].point, currentCandidate[1].point], obscured: currentObscured });

    return results;

  });

  return culled.reduce((svgLines: ScreenSpaceLines, line) => {

    if (line.obscured) {
      svgLines.obscured.push(line.line);
    } else {
      svgLines.visible.push(line.line);
    }

    return svgLines;

  }, { visible: [], obscured: [] });
}
