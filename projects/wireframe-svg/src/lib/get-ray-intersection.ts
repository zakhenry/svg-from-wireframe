import { Matrix, Vector3 } from './Maths';
import { intersectTriangles } from './Maths/mesh';
import { Ray } from './Maths/ray';

export function getRayIntersection(ray: Ray, positionsPrimitive: Float32Array, indices: Int32Array, worldMatrix: Matrix): number | null {

  const tm = Matrix.Identity();
  worldMatrix.invertToRef(tm);
  const testRay = Ray.Transform(ray, tm);

  const positions = [];

  for(let i=0; i<positionsPrimitive.length; i+=3) {
    positions.push(new Vector3(positionsPrimitive[i], positionsPrimitive[i+1], positionsPrimitive[i+2]));
  }

  const intersectionInfo = intersectTriangles(testRay, positions, indices, 3, false, false);

  if (!intersectionInfo) {
    return null;
  }

  const worldOrigin = Vector3.TransformCoordinates(testRay.origin, worldMatrix);
  const direction = testRay.direction.scale(intersectionInfo.distance);
  const worldDirection = Vector3.TransformNormal(direction, worldMatrix);
  const pickedPoint = worldDirection.addInPlace(worldOrigin);
  const distance = Vector3.Distance(worldOrigin, pickedPoint);

  return distance;
}
