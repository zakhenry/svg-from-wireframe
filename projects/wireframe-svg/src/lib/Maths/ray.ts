import { ArrayTools } from './arrayTools';
import { DeepImmutable, Nullable } from './types';

import { IntersectionInfo } from './intersectionInfo';
import { Matrix, Vector3 } from './vector';

/**
 * Class representing a ray with position and direction
 */
export class Ray {
  private static readonly TmpVector3 = ArrayTools.BuildArray(6, Vector3.Zero);

  /**
   * Creates a new ray
   * @param origin origin point
   * @param direction direction
   * @param length length of the ray
   */
  constructor(
    /** origin point */
    public origin: Vector3,
    /** direction */
    public direction: Vector3,
    /** length of the ray */
    public length: number = Number.MAX_VALUE,
  ) {}

  /**
   * If the ray hits a triange
   * @param vertex0 triangle vertex
   * @param vertex1 triangle vertex
   * @param vertex2 triangle vertex
   * @returns intersection information if hit
   */
  public intersectsTriangle(
    vertex0: DeepImmutable<Vector3>,
    vertex1: DeepImmutable<Vector3>,
    vertex2: DeepImmutable<Vector3>,
  ): Nullable<IntersectionInfo> {
    const edge1 = Ray.TmpVector3[0];
    const edge2 = Ray.TmpVector3[1];
    const pvec = Ray.TmpVector3[2];
    const tvec = Ray.TmpVector3[3];
    const qvec = Ray.TmpVector3[4];

    vertex1.subtractToRef(vertex0, edge1);
    vertex2.subtractToRef(vertex0, edge2);
    Vector3.CrossToRef(this.direction, edge2, pvec);
    var det = Vector3.Dot(edge1, pvec);

    if (det === 0) {
      return null;
    }

    var invdet = 1 / det;

    this.origin.subtractToRef(vertex0, tvec);

    var bv = Vector3.Dot(tvec, pvec) * invdet;

    if (bv < 0 || bv > 1.0) {
      return null;
    }

    Vector3.CrossToRef(tvec, edge1, qvec);

    var bw = Vector3.Dot(this.direction, qvec) * invdet;

    if (bw < 0 || bv + bw > 1.0) {
      return null;
    }

    //check if the distance is longer than the predefined length.
    var distance = Vector3.Dot(edge2, qvec) * invdet;
    if (distance > this.length) {
      return null;
    }

    return new IntersectionInfo(1 - bv - bw, bv, distance);
  }

  /**
   * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
   * transformed to the given world matrix.
   * @param origin The origin point
   * @param end The end point
   * @param world a matrix to transform the ray to. Default is the identity matrix.
   * @returns the new ray
   */
  public static CreateNewFromTo(
    origin: DeepImmutable<Vector3>,
    end: DeepImmutable<Vector3>,
    world: DeepImmutable<Matrix> = Matrix._identityReadOnly,
  ): Ray {
    var direction = end.subtract(origin);
    var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    direction.normalize();

    return Ray.Transform(new Ray(origin, direction, length), world);
  }

  /**
   * Transforms a ray by a matrix
   * @param ray ray to transform
   * @param matrix matrix to apply
   * @returns the resulting new ray
   */
  public static Transform(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>): Ray {
    var result = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
    Ray.TransformToRef(ray, matrix, result);

    return result;
  }

  /**
   * Transforms a ray by a matrix
   * @param ray ray to transform
   * @param matrix matrix to apply
   * @param result ray to store result in
   */
  public static TransformToRef(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>, result: Ray): void {
    Vector3.TransformCoordinatesToRef(ray.origin, matrix, result.origin);
    Vector3.TransformNormalToRef(ray.direction, matrix, result.direction);
    result.length = ray.length;

    var dir = result.direction;
    var len = dir.length();

    if (!(len === 0 || len === 1)) {
      var num = 1.0 / len;
      dir.x *= num;
      dir.y *= num;
      dir.z *= num;
      result.length *= len;
    }
  }
}
