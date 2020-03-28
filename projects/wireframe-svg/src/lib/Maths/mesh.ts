import { IndicesArray, Nullable } from '../types';
import { IntersectionInfo } from './intersectionInfo';
import { Vector3 } from './math.vector';
import { Ray } from './ray';

export function intersectTriangles(
  ray: Ray,
  positions: Vector3[],
  indices: IndicesArray,
  step: number,
  checkStopper: boolean,
  fastCheck?: boolean,
): Nullable<IntersectionInfo> {
  var intersectInfo: Nullable<IntersectionInfo> = null;

  // Triangles test
  let faceID = -1;
  for (var index = 0; index < indices.length; index += step) {
    faceID++;
    const indexA = indices[index];
    const indexB = indices[index + 1];
    const indexC = indices[index + 2];

    if (checkStopper && indexC === 0xffffffff) {
      index += 2;
      continue;
    }

    var p0 = positions[indexA];
    var p1 = positions[indexB];
    var p2 = positions[indexC];

    if (!p0) {
      debugger;
    }

    var currentIntersectInfo = ray.intersectsTriangle(p0, p1, p2);

    if (currentIntersectInfo) {
      if (currentIntersectInfo.distance < 0) {
        continue;
      }

      if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
        intersectInfo = currentIntersectInfo;
        intersectInfo.faceId = faceID;

        if (fastCheck) {
          break;
        }
      }
    }
  }
  return intersectInfo;
}
