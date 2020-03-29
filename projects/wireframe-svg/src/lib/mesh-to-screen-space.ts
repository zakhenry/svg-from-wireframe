import { getIntersectionPointFast } from './compute-intersection';
import { dedupeLines } from './dedupe-lines';
import { findEdgeLines } from './find-edge-lines';
import { getRayIntersection } from './get-ray-intersection';
import { EdgeCandidate, LineSegment, LineSegment3D, ProjectedLine } from './interfaces';
import { Matrix, Vector2, Vector3 } from './Maths/vector';
import { Viewport } from './Maths/viewport';
import { Ray } from './Maths/ray';

export interface ScreenSpaceLines {
  obscured: LineSegment[];
  visible: LineSegment[];
}

export function viewSpaceLinesToScreenSpaceLines(
  wireframeLines: LineSegment3D[] | null,
  edgeCandidates: EdgeCandidate[],
  meshWorldMatrix: Matrix,
  sceneTransformMatrix: Matrix,
  sceneViewMatrix: Matrix,
  sceneProjectionMatrix: Matrix,
  viewport: Viewport,
  cameraForwardVector: Vector3,
  width: number,
  height: number,
  mesh,
): ScreenSpaceLines {
  const identity = Matrix.Identity();

  const edgeLines = findEdgeLines(
    edgeCandidates,
    meshWorldMatrix,
    cameraForwardVector,
    wireframeLines && wireframeLines.length > 0,
  );

  const projectedLinesWithDuplicates: ProjectedLine[] = (wireframeLines || [])
    .concat(edgeLines)
    .map((viewSpace: LineSegment3D) => {
      const screenSpace = viewSpace.map((v, j) => {
        const coordinates = Vector3.Project(v, meshWorldMatrix, sceneTransformMatrix, viewport);

        return new Vector2(width * coordinates.x, height * coordinates.y);
      }) as LineSegment;

      return { screenSpace, viewSpace };
    });

  const projectedLines = dedupeLines(projectedLinesWithDuplicates);

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

    const sortedIntersections = !intersectionsMap.has(index)
      ? []
      : intersectionsMap
          .get(index)
          .map(point => {
            return {
              point,
              distance: Vector2.Distance(line[0], point),
            };
          })
          .sort((a, b) => a.distance - b.distance);

    const candidateNodes = [
      { distance: 0, point: line[0] },
      ...sortedIntersections,
      { distance: screenSpaceDistance, point: line[1] },
    ];

    let currentObscured = null;

    const results: Array<{ obscured: boolean; line: LineSegment }> = [];

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

      const pick = getRayIntersection(ray, mesh.positions, mesh.indices, meshWorldMatrix);

      const obscured = pick !== null && ray.length - pick > 0.01;

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

  return culled.reduce(
    (svgLines: ScreenSpaceLines, line) => {
      if (line.obscured) {
        svgLines.obscured.push(line.line);
      } else {
        svgLines.visible.push(line.line);
      }

      return svgLines;
    },
    { visible: [], obscured: [] },
  );
}
