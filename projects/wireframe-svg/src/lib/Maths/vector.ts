import { ArrayTools } from './arrayTools';
import { DeepImmutable, float } from './types';
import { Scalar } from './scalar';
import { Viewport } from './viewport';

export const Epsilon = 0.001;

/**
 * Class representing a vector containing 2 coordinates
 */
export class Vector2 {
  /**
   * Creates a new Vector2 from the given x and y coordinates
   * @param x defines the first coordinate
   * @param y defines the second coordinate
   */
  constructor(
    /** defines the first coordinate */
    public x: number = 0,
    /** defines the second coordinate */
    public y: number = 0,
  ) {}

  /**
   * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".
   * @param start defines the start vector
   * @param end defines the end vector
   * @param amount defines the interpolation factor
   * @returns a new Vector2
   */
  public static Lerp(start: DeepImmutable<Vector2>, end: DeepImmutable<Vector2>, amount: number): Vector2 {
    var x = start.x + (end.x - start.x) * amount;
    var y = start.y + (end.y - start.y) * amount;
    return new Vector2(x, y);
  }

  /**
   * Gets the distance between the vectors "value1" and "value2"
   * @param value1 defines first vector
   * @param value2 defines second vector
   * @returns the distance between vectors
   */
  public static Distance(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>): number {
    return Math.sqrt(Vector2.DistanceSquared(value1, value2));
  }

  /**
   * Returns the squared distance between the vectors "value1" and "value2"
   * @param value1 defines first vector
   * @param value2 defines second vector
   * @returns the squared distance between vectors
   */
  public static DistanceSquared(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>): number {
    var x = value1.x - value2.x;
    var y = value1.y - value2.y;
    return x * x + y * y;
  }

  // Operators

  /**
   * Sets the Vector2 coordinates with the given floats
   * @param x defines the first coordinate
   * @param y defines the second coordinate
   * @returns the current updated Vector2
   */
  public copyFromFloats(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Sets the Vector2 coordinates with the given floats
   * @param x defines the first coordinate
   * @param y defines the second coordinate
   * @returns the current updated Vector2
   */
  public set(x: number, y: number): Vector2 {
    return this.copyFromFloats(x, y);
  }
  /**
   * Add another vector with the current one
   * @param otherVector defines the other vector
   * @returns a new Vector2 set with the addition of the current Vector2 and the given one coordinates
   */
  public add(otherVector: DeepImmutable<Vector2>): Vector2 {
    return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
  }

  /**
   * Gets a new Vector2 set with the subtracted coordinates of the given one from the current Vector2
   * @param otherVector defines the other vector
   * @returns a new Vector2
   */
  public subtract(otherVector: Vector2): Vector2 {
    return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
  }

  /**
   * Returns a new Vector2 scaled by "scale" from the current Vector2
   * @param scale defines the scaling factor
   * @returns a new Vector2
   */
  public scale(scale: number): Vector2 {
    let result = new Vector2(0, 0);
    this.scaleToRef(scale, result);
    return result;
  }

  /**
   * Scale the current Vector2 values by a factor to a given Vector2
   * @param scale defines the scale factor
   * @param result defines the Vector2 object where to store the result
   * @returns the unmodified current Vector2
   */
  public scaleToRef(scale: number, result: Vector2): Vector2 {
    result.x = this.x * scale;
    result.y = this.y * scale;
    return this;
  }
  /**
   * Gets a boolean if two vectors are equals (using an epsilon value)
   * @param otherVector defines the other vector
   * @param epsilon defines the minimal distance to consider equality
   * @returns true if the given vector coordinates are close to the current ones by a distance of epsilon.
   */
  public equalsWithEpsilon(otherVector: DeepImmutable<Vector2>, epsilon: number = Epsilon): boolean {
    return (
      otherVector &&
      Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) &&
      Scalar.WithinEpsilon(this.y, otherVector.y, epsilon)
    );
  }

  // Properties

  /**
   * Gets the length of the vector
   * @returns the vector length (float)
   */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Gets a new Vector2 copied from the Vector2
   * @returns a new Vector2
   */
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

/**
 * Class used to store (x,y,z) vector representation
 * A Vector3 is the main object used in 3D geometry
 * It can represent etiher the coordinates of a point the space, either a direction
 * Reminder: js uses a left handed forward facing system
 */
export class Vector3 {
  /**
   * Creates a new Vector3 object from the given x, y, z (floats) coordinates.
   * @param x defines the first coordinates (on X axis)
   * @param y defines the second coordinates (on Y axis)
   * @param z defines the third coordinates (on Z axis)
   */
  constructor(
    /**
     * Defines the first coordinates (on X axis)
     */
    public x: number = 0,
    /**
     * Defines the second coordinates (on Y axis)
     */
    public y: number = 0,
    /**
     * Defines the third coordinates (on Z axis)
     */
    public z: number = 0,
  ) {}

  // Statics

  /**
   * Returns a new Vector3 set from the index "offset" of the given array
   * @param array defines the source array
   * @param offset defines the offset in the source array
   * @returns the new Vector3
   */
  public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Vector3 {
    return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
  }

  /**
   * Returns a new Vector3 set to (0.0, 0.0, 0.0)
   * @returns a new empty Vector3
   */
  public static Zero(): Vector3 {
    return new Vector3(0.0, 0.0, 0.0);
  }

  /**
   * Returns a new Vector3 set with the result of the transformation by the given matrix of the given vector.
   * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
   * @param vector defines the Vector3 to transform
   * @param transformation defines the transformation matrix
   * @returns the transformed Vector3
   */
  public static TransformCoordinates(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>): Vector3 {
    var result = Vector3.Zero();
    Vector3.TransformCoordinatesToRef(vector, transformation, result);
    return result;
  }

  /**
   * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given vector
   * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
   * @param vector defines the Vector3 to transform
   * @param transformation defines the transformation matrix
   * @param result defines the Vector3 where to store the result
   */
  public static TransformCoordinatesToRef(
    vector: DeepImmutable<Vector3>,
    transformation: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    Vector3.TransformCoordinatesFromFloatsToRef(vector.x, vector.y, vector.z, transformation, result);
  }

  /**
   * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given floats (x, y, z)
   * This method computes tranformed coordinates only, not transformed direction vectors
   * @param x define the x coordinate of the source vector
   * @param y define the y coordinate of the source vector
   * @param z define the z coordinate of the source vector
   * @param transformation defines the transformation matrix
   * @param result defines the Vector3 where to store the result
   */
  public static TransformCoordinatesFromFloatsToRef(
    x: number,
    y: number,
    z: number,
    transformation: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    const m = transformation.m;
    var rx = x * m[0] + y * m[4] + z * m[8] + m[12];
    var ry = x * m[1] + y * m[5] + z * m[9] + m[13];
    var rz = x * m[2] + y * m[6] + z * m[10] + m[14];
    var rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);

    result.x = rx * rw;
    result.y = ry * rw;
    result.z = rz * rw;
  }

  /**
   * Returns a new Vector3 set with the result of the normal transformation by the given matrix of the given vector
   * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
   * @param vector defines the Vector3 to transform
   * @param transformation defines the transformation matrix
   * @returns the new Vector3
   */
  public static TransformNormal(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>): Vector3 {
    var result = Vector3.Zero();
    Vector3.TransformNormalToRef(vector, transformation, result);
    return result;
  }

  /**
   * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given vector
   * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
   * @param vector defines the Vector3 to transform
   * @param transformation defines the transformation matrix
   * @param result defines the Vector3 where to store the result
   */
  public static TransformNormalToRef(
    vector: DeepImmutable<Vector3>,
    transformation: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    this.TransformNormalFromFloatsToRef(vector.x, vector.y, vector.z, transformation, result);
  }

  /**
   * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given floats (x, y, z)
   * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
   * @param x define the x coordinate of the source vector
   * @param y define the y coordinate of the source vector
   * @param z define the z coordinate of the source vector
   * @param transformation defines the transformation matrix
   * @param result defines the Vector3 where to store the result
   */
  public static TransformNormalFromFloatsToRef(
    x: number,
    y: number,
    z: number,
    transformation: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    const m = transformation.m;
    result.x = x * m[0] + y * m[4] + z * m[8];
    result.y = x * m[1] + y * m[5] + z * m[9];
    result.z = x * m[2] + y * m[6] + z * m[10];
  }

  /**
   * Returns a new Vector3 located for "amount" (float) on the linear interpolation between the vectors "start" and "end"
   * @param start defines the start value
   * @param end defines the end value
   * @param amount max defines amount between both (between 0 and 1)
   * @returns the new Vector3
   */
  public static Lerp(start: DeepImmutable<Vector3>, end: DeepImmutable<Vector3>, amount: number): Vector3 {
    var result = new Vector3(0, 0, 0);
    Vector3.LerpToRef(start, end, amount, result);
    return result;
  }

  /**
   * Sets the given vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end"
   * @param start defines the start value
   * @param end defines the end value
   * @param amount max defines amount between both (between 0 and 1)
   * @param result defines the Vector3 where to store the result
   */
  public static LerpToRef(
    start: DeepImmutable<Vector3>,
    end: DeepImmutable<Vector3>,
    amount: number,
    result: Vector3,
  ): void {
    result.x = start.x + (end.x - start.x) * amount;
    result.y = start.y + (end.y - start.y) * amount;
    result.z = start.z + (end.z - start.z) * amount;
  }

  /**
   * Returns the dot product (float) between the vectors "left" and "right"
   * @param left defines the left operand
   * @param right defines the right operand
   * @returns the dot product
   */
  public static Dot(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): number {
    return left.x * right.x + left.y * right.y + left.z * right.z;
  }

  /**
   * Returns a new Vector3 as the cross product of the vectors "left" and "right"
   * The cross product is then orthogonal to both "left" and "right"
   * @param left defines the left operand
   * @param right defines the right operand
   * @returns the cross product
   */
  public static Cross(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): Vector3 {
    var result = Vector3.Zero();
    Vector3.CrossToRef(left, right, result);
    return result;
  }

  /**
   * Sets the given vector "result" with the cross product of "left" and "right"
   * The cross product is then orthogonal to both "left" and "right"
   * @param left defines the left operand
   * @param right defines the right operand
   * @param result defines the Vector3 where to store the result
   */
  public static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void {
    const x = left.y * right.z - left.z * right.y;
    const y = left.z * right.x - left.x * right.z;
    const z = left.x * right.y - left.y * right.x;
    result.copyFromFloats(x, y, z);
  }

  /**
   * Project a Vector3 onto screen space
   * @param vector defines the Vector3 to project
   * @param world defines the world matrix to use
   * @param transform defines the transform (view x projection) matrix to use
   * @param viewport defines the screen viewport to use
   * @returns the new Vector3
   */
  public static Project(
    vector: DeepImmutable<Vector3>,
    world: DeepImmutable<Matrix>,
    transform: DeepImmutable<Matrix>,
    viewport: DeepImmutable<Viewport>,
  ): Vector3 {
    var cw = viewport.width;
    var ch = viewport.height;
    var cx = viewport.x;
    var cy = viewport.y;

    var viewportMatrix = MathTmp.Matrix[1];

    Matrix.FromValuesToRef(
      cw / 2.0,
      0,
      0,
      0,
      0,
      -ch / 2.0,
      0,
      0,
      0,
      0,
      0.5,
      0,
      cx + cw / 2.0,
      ch / 2.0 + cy,
      0.5,
      1,
      viewportMatrix,
    );

    var matrix = MathTmp.Matrix[0];
    world.multiplyToRef(transform, matrix);
    matrix.multiplyToRef(viewportMatrix, matrix);

    return Vector3.TransformCoordinates(vector, matrix);
  }

  /** @hidden */
  public static _UnprojectFromInvertedMatrixToRef(
    source: DeepImmutable<Vector3>,
    matrix: DeepImmutable<Matrix>,
    result: Vector3,
  ) {
    Vector3.TransformCoordinatesToRef(source, matrix, result);
    console.log('before scaling', result);
    const m = matrix.m;
    var num = source.x * m[3] + source.y * m[7] + source.z * m[11] + m[15];
    if (Scalar.WithinEpsilon(num, 1.0)) {
      result.scaleInPlace(1.0 / num);
    }
    console.log('after scaling', num, result);
  }

  /**
   * Unproject from screen space to object space
   * @param source defines the screen space Vector3 to use
   * @param viewportWidth defines the current width of the viewport
   * @param viewportHeight defines the current height of the viewport
   * @param world defines the world matrix to use (can be set to Identity to go to world space)
   * @param view defines the view matrix to use
   * @param projection defines the projection matrix to use
   * @returns the new Vector3
   */
  public static Unproject(
    source: DeepImmutable<Vector3>,
    viewportWidth: number,
    viewportHeight: number,
    world: DeepImmutable<Matrix>,
    view: DeepImmutable<Matrix>,
    projection: DeepImmutable<Matrix>,
  ): Vector3 {
    let result = Vector3.Zero();

    Vector3.UnprojectToRef(source, viewportWidth, viewportHeight, world, view, projection, result);

    return result;
  }

  /**
   * Unproject from screen space to object space
   * @param source defines the screen space Vector3 to use
   * @param viewportWidth defines the current width of the viewport
   * @param viewportHeight defines the current height of the viewport
   * @param world defines the world matrix to use (can be set to Identity to go to world space)
   * @param view defines the view matrix to use
   * @param projection defines the projection matrix to use
   * @param result defines the Vector3 where to store the result
   */
  public static UnprojectToRef(
    source: DeepImmutable<Vector3>,
    viewportWidth: number,
    viewportHeight: number,
    world: DeepImmutable<Matrix>,
    view: DeepImmutable<Matrix>,
    projection: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    Vector3.UnprojectFloatsToRef(
      source.x,
      source.y,
      source.z,
      viewportWidth,
      viewportHeight,
      world,
      view,
      projection,
      result,
    );
  }

  /**
   * Unproject from screen space to object space
   * @param sourceX defines the screen space x coordinate to use
   * @param sourceY defines the screen space y coordinate to use
   * @param sourceZ defines the screen space z coordinate to use
   * @param viewportWidth defines the current width of the viewport
   * @param viewportHeight defines the current height of the viewport
   * @param world defines the world matrix to use (can be set to Identity to go to world space)
   * @param view defines the view matrix to use
   * @param projection defines the projection matrix to use
   * @param result defines the Vector3 where to store the result
   */
  public static UnprojectFloatsToRef(
    sourceX: float,
    sourceY: float,
    sourceZ: float,
    viewportWidth: number,
    viewportHeight: number,
    world: DeepImmutable<Matrix>,
    view: DeepImmutable<Matrix>,
    projection: DeepImmutable<Matrix>,
    result: Vector3,
  ): void {
    var matrix = MathTmp.Matrix[0];
    world.multiplyToRef(view, matrix);
    matrix.multiplyToRef(projection, matrix);
    console.log('unproject matrix before invert', (matrix as any)._m);
    matrix.invert();

    console.log(`viewport`, viewportWidth, viewportWidth);
    console.log('unproject matrix', (matrix as any)._m);

    var screenSource = MathTmp.Vector3[0];
    screenSource.x = (sourceX / viewportWidth) * 2 - 1;
    screenSource.y = -((sourceY / viewportHeight) * 2 - 1);
    screenSource.z = 2 * sourceZ - 1.0;

    console.log(`projection point`, screenSource);
    Vector3._UnprojectFromInvertedMatrixToRef(screenSource, matrix, result);
  }

  /**
   * Returns the distance between the vectors "value1" and "value2"
   * @param value1 defines the first operand
   * @param value2 defines the second operand
   * @returns the distance
   */
  public static Distance(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): number {
    return Math.sqrt(Vector3.DistanceSquared(value1, value2));
  }

  /**
   * Returns the squared distance between the vectors "value1" and "value2"
   * @param value1 defines the first operand
   * @param value2 defines the second operand
   * @returns the squared distance
   */
  public static DistanceSquared(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): number {
    var x = value1.x - value2.x;
    var y = value1.y - value2.y;
    var z = value1.z - value2.z;

    return x * x + y * y + z * z;
  }

  /**
   * Returns a new Vector3 located at the center between "value1" and "value2"
   * @param value1 defines the first operand
   * @param value2 defines the second operand
   * @returns the new Vector3
   */
  public static Center(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): Vector3 {
    var center = value1.add(value2);
    center.scaleInPlace(0.5);
    return center;
  }

  /**
   * Adds the given vector to the current Vector3
   * @param otherVector defines the second operand
   * @returns the current updated Vector3
   */
  public addInPlace(otherVector: DeepImmutable<Vector3>): Vector3 {
    return this.addInPlaceFromFloats(otherVector.x, otherVector.y, otherVector.z);
  }

  /**
   * Adds the given coordinates to the current Vector3
   * @param x defines the x coordinate of the operand
   * @param y defines the y coordinate of the operand
   * @param z defines the z coordinate of the operand
   * @returns the current updated Vector3
   */
  public addInPlaceFromFloats(x: number, y: number, z: number): Vector3 {
    this.x += x;
    this.y += y;
    this.z += z;
    return this;
  }

  /**
   * Gets a new Vector3, result of the addition the current Vector3 and the given vector
   * @param otherVector defines the second operand
   * @returns the resulting Vector3
   */
  public add(otherVector: DeepImmutable<Vector3>): Vector3 {
    return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
  }

  /**
   * Returns a new Vector3, result of the subtraction of the given vector from the current Vector3
   * @param otherVector defines the second operand
   * @returns the resulting Vector3
   */
  public subtract(otherVector: DeepImmutable<Vector3>): Vector3 {
    return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
  }

  /**
   * Subtracts the given vector from the current Vector3 and stores the result in the vector "result".
   * @param otherVector defines the second operand
   * @param result defines the Vector3 object where to store the result
   * @returns the current Vector3
   */
  public subtractToRef(otherVector: DeepImmutable<Vector3>, result: Vector3): Vector3 {
    return this.subtractFromFloatsToRef(otherVector.x, otherVector.y, otherVector.z, result);
  }

  /**
   * Subtracts the given floats from the current Vector3 coordinates and set the given vector "result" with this result
   * @param x defines the x coordinate of the operand
   * @param y defines the y coordinate of the operand
   * @param z defines the z coordinate of the operand
   * @param result defines the Vector3 object where to store the result
   * @returns the current Vector3
   */
  public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3 {
    return result.copyFromFloats(this.x - x, this.y - y, this.z - z);
  }

  /**
   * Multiplies the Vector3 coordinates by the float "scale"
   * @param scale defines the multiplier factor
   * @returns the current updated Vector3
   */
  public scaleInPlace(scale: number): Vector3 {
    this.x *= scale;
    this.y *= scale;
    this.z *= scale;
    return this;
  }

  /**
   * Returns a new Vector3 set with the current Vector3 coordinates multiplied by the float "scale"
   * @param scale defines the multiplier factor
   * @returns a new Vector3
   */
  public scale(scale: number): Vector3 {
    return new Vector3(this.x * scale, this.y * scale, this.z * scale);
  }

  /**
   * Returns true if the current Vector3 and the given vector coordinates are distant less than epsilon
   * @param otherVector defines the second operand
   * @param epsilon defines the minimal distance to define values as equals
   * @returns true if both vectors are distant less than epsilon
   */
  public equalsWithEpsilon(otherVector: DeepImmutable<Vector3>, epsilon: number = Epsilon): boolean {
    return (
      otherVector &&
      Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) &&
      Scalar.WithinEpsilon(this.y, otherVector.y, epsilon) &&
      Scalar.WithinEpsilon(this.z, otherVector.z, epsilon)
    );
  }

  // Properties
  /**
   * Gets the length of the Vector3
   * @returns the length of the Vector3
   */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalize the current Vector3.
   * Please note that this is an in place operation.
   * @returns the current updated Vector3
   */
  public normalize(): Vector3 {
    return this.normalizeFromLength(this.length());
  }

  /**
   * Normalize the current Vector3 with the given input length.
   * Please note that this is an in place operation.
   * @param len the length of the vector
   * @returns the current updated Vector3
   */
  public normalizeFromLength(len: number): Vector3 {
    if (len === 0 || len === 1.0) {
      return this;
    }

    return this.scaleInPlace(1.0 / len);
  }

  /**
   * Copies the given floats to the current Vector3 coordinates
   * @param x defines the x coordinate of the operand
   * @param y defines the y coordinate of the operand
   * @param z defines the z coordinate of the operand
   * @returns the current updated Vector3
   */
  public copyFromFloats(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Copies the given floats to the current Vector3 coordinates
   * @param x defines the x coordinate of the operand
   * @param y defines the y coordinate of the operand
   * @param z defines the z coordinate of the operand
   * @returns the current updated Vector3
   */
  public set(x: number, y: number, z: number): Vector3 {
    return this.copyFromFloats(x, y, z);
  }
}

/**
 * Class used to store matrix data (4x4)
 */
export class Matrix {
  /**
   * Gets the internal data of the matrix
   */
  public get m(): DeepImmutable<Float32Array> {
    return this._m;
  }

  /**
   * Creates an empty matrix (filled with zeros)
   */
  public constructor() {
    this._updateIdentityStatus(false);
  }
  private static _updateFlagSeed = 0;
  public static _identityReadOnly = Matrix.Identity() as DeepImmutable<Matrix>;

  private _isIdentity = false;
  private _isIdentityDirty = true;
  private _isIdentity3x2 = true;
  private _isIdentity3x2Dirty = true;
  /**
   * Gets the update flag of the matrix which is an unique number for the matrix.
   * It will be incremented every time the matrix data change.
   * You can use it to speed the comparison between two versions of the same matrix.
   */
  public updateFlag: number = -1;

  private readonly _m: Float32Array = new Float32Array(16);

  // Statics
  /**
   * Creates a matrix from an array
   * @param array defines the source array
   * @param offset defines an offset in the source array
   * @returns a new Matrix set from the starting index of the given array
   */
  public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Matrix {
    var result = new Matrix();
    Matrix.FromArrayToRef(array, offset, result);
    return result;
  }

  /**
   * Copy the content of an array into a given matrix
   * @param array defines the source array
   * @param offset defines an offset in the source array
   * @param result defines the target matrix
   */
  public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Matrix) {
    for (var index = 0; index < 16; index++) {
      result._m[index] = array[index + offset];
    }
    result._markAsUpdated();
  }

  /**
   * Stores a list of values (16) inside a given matrix
   * @param initialM11 defines 1st value of 1st row
   * @param initialM12 defines 2nd value of 1st row
   * @param initialM13 defines 3rd value of 1st row
   * @param initialM14 defines 4th value of 1st row
   * @param initialM21 defines 1st value of 2nd row
   * @param initialM22 defines 2nd value of 2nd row
   * @param initialM23 defines 3rd value of 2nd row
   * @param initialM24 defines 4th value of 2nd row
   * @param initialM31 defines 1st value of 3rd row
   * @param initialM32 defines 2nd value of 3rd row
   * @param initialM33 defines 3rd value of 3rd row
   * @param initialM34 defines 4th value of 3rd row
   * @param initialM41 defines 1st value of 4th row
   * @param initialM42 defines 2nd value of 4th row
   * @param initialM43 defines 3rd value of 4th row
   * @param initialM44 defines 4th value of 4th row
   * @param result defines the target matrix
   */
  public static FromValuesToRef(
    initialM11: number,
    initialM12: number,
    initialM13: number,
    initialM14: number,
    initialM21: number,
    initialM22: number,
    initialM23: number,
    initialM24: number,
    initialM31: number,
    initialM32: number,
    initialM33: number,
    initialM34: number,
    initialM41: number,
    initialM42: number,
    initialM43: number,
    initialM44: number,
    result: Matrix,
  ): void {
    const m = result._m;
    m[0] = initialM11;
    m[1] = initialM12;
    m[2] = initialM13;
    m[3] = initialM14;
    m[4] = initialM21;
    m[5] = initialM22;
    m[6] = initialM23;
    m[7] = initialM24;
    m[8] = initialM31;
    m[9] = initialM32;
    m[10] = initialM33;
    m[11] = initialM34;
    m[12] = initialM41;
    m[13] = initialM42;
    m[14] = initialM43;
    m[15] = initialM44;

    result._markAsUpdated();
  }

  /**
   * Creates new matrix from a list of values (16)
   * @param initialM11 defines 1st value of 1st row
   * @param initialM12 defines 2nd value of 1st row
   * @param initialM13 defines 3rd value of 1st row
   * @param initialM14 defines 4th value of 1st row
   * @param initialM21 defines 1st value of 2nd row
   * @param initialM22 defines 2nd value of 2nd row
   * @param initialM23 defines 3rd value of 2nd row
   * @param initialM24 defines 4th value of 2nd row
   * @param initialM31 defines 1st value of 3rd row
   * @param initialM32 defines 2nd value of 3rd row
   * @param initialM33 defines 3rd value of 3rd row
   * @param initialM34 defines 4th value of 3rd row
   * @param initialM41 defines 1st value of 4th row
   * @param initialM42 defines 2nd value of 4th row
   * @param initialM43 defines 3rd value of 4th row
   * @param initialM44 defines 4th value of 4th row
   * @returns the new matrix
   */
  public static FromValues(
    initialM11: number,
    initialM12: number,
    initialM13: number,
    initialM14: number,
    initialM21: number,
    initialM22: number,
    initialM23: number,
    initialM24: number,
    initialM31: number,
    initialM32: number,
    initialM33: number,
    initialM34: number,
    initialM41: number,
    initialM42: number,
    initialM43: number,
    initialM44: number,
  ): Matrix {
    var result = new Matrix();
    const m = result._m;
    m[0] = initialM11;
    m[1] = initialM12;
    m[2] = initialM13;
    m[3] = initialM14;
    m[4] = initialM21;
    m[5] = initialM22;
    m[6] = initialM23;
    m[7] = initialM24;
    m[8] = initialM31;
    m[9] = initialM32;
    m[10] = initialM33;
    m[11] = initialM34;
    m[12] = initialM41;
    m[13] = initialM42;
    m[14] = initialM43;
    m[15] = initialM44;
    result._markAsUpdated();
    return result;
  }

  /**
   * Creates a new identity matrix
   * @returns a new identity matrix
   */
  public static Identity(): Matrix {
    const identity = Matrix.FromValues(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    identity._updateIdentityStatus(true);
    return identity;
  }

  /**
   * Creates a new identity matrix and stores the result in a given matrix
   * @param result defines the target matrix
   */
  public static IdentityToRef(result: Matrix): void {
    Matrix.FromValuesToRef(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, result);
    result._updateIdentityStatus(true);
  }
  /**
   * Creates a new matrix as the invert of a given matrix
   * @param source defines the source matrix
   * @returns the new matrix
   */
  public static Invert(source: DeepImmutable<Matrix>): Matrix {
    var result = new Matrix();
    source.invertToRef(result);
    return result;
  }

  /** @hidden */
  public _markAsUpdated() {
    this.updateFlag = Matrix._updateFlagSeed++;
    this._isIdentity = false;
    this._isIdentity3x2 = false;
    this._isIdentityDirty = true;
    this._isIdentity3x2Dirty = true;
  }

  /** @hidden */
  private _updateIdentityStatus(
    isIdentity: boolean,
    isIdentityDirty: boolean = false,
    isIdentity3x2: boolean = false,
    isIdentity3x2Dirty: boolean = true,
  ) {
    this.updateFlag = Matrix._updateFlagSeed++;
    this._isIdentity = isIdentity;
    this._isIdentity3x2 = isIdentity || isIdentity3x2;
    this._isIdentityDirty = this._isIdentity ? false : isIdentityDirty;
    this._isIdentity3x2Dirty = this._isIdentity3x2 ? false : isIdentity3x2Dirty;
  }

  /**
   * Inverts the current matrix in place
   * @returns the current inverted matrix
   */
  public invert(): Matrix {
    this.invertToRef(this);
    return this;
  }

  /**
   * Sets the given matrix to the current inverted Matrix
   * @param other defines the target matrix
   * @returns the unmodified current matrix
   */
  public invertToRef(other: Matrix): Matrix {
    if (this._isIdentity === true) {
      Matrix.IdentityToRef(other);
      return this;
    }

    // the inverse of a Matrix is the transpose of cofactor matrix divided by the determinant
    const m = this._m;
    const m00 = m[0],
      m01 = m[1],
      m02 = m[2],
      m03 = m[3];
    const m10 = m[4],
      m11 = m[5],
      m12 = m[6],
      m13 = m[7];
    const m20 = m[8],
      m21 = m[9],
      m22 = m[10],
      m23 = m[11];
    const m30 = m[12],
      m31 = m[13],
      m32 = m[14],
      m33 = m[15];

    const det_22_33 = m22 * m33 - m32 * m23;
    const det_21_33 = m21 * m33 - m31 * m23;
    const det_21_32 = m21 * m32 - m31 * m22;
    const det_20_33 = m20 * m33 - m30 * m23;
    const det_20_32 = m20 * m32 - m22 * m30;
    const det_20_31 = m20 * m31 - m30 * m21;

    const cofact_00 = +(m11 * det_22_33 - m12 * det_21_33 + m13 * det_21_32);
    const cofact_01 = -(m10 * det_22_33 - m12 * det_20_33 + m13 * det_20_32);
    const cofact_02 = +(m10 * det_21_33 - m11 * det_20_33 + m13 * det_20_31);
    const cofact_03 = -(m10 * det_21_32 - m11 * det_20_32 + m12 * det_20_31);

    const det = m00 * cofact_00 + m01 * cofact_01 + m02 * cofact_02 + m03 * cofact_03;

    if (det === 0) {
      // not invertible
      other.copyFrom(this);
      return this;
    }

    const detInv = 1 / det;
    const det_12_33 = m12 * m33 - m32 * m13;
    const det_11_33 = m11 * m33 - m31 * m13;
    const det_11_32 = m11 * m32 - m31 * m12;
    const det_10_33 = m10 * m33 - m30 * m13;
    const det_10_32 = m10 * m32 - m30 * m12;
    const det_10_31 = m10 * m31 - m30 * m11;
    const det_12_23 = m12 * m23 - m22 * m13;
    const det_11_23 = m11 * m23 - m21 * m13;
    const det_11_22 = m11 * m22 - m21 * m12;
    const det_10_23 = m10 * m23 - m20 * m13;
    const det_10_22 = m10 * m22 - m20 * m12;
    const det_10_21 = m10 * m21 - m20 * m11;

    const cofact_10 = -(m01 * det_22_33 - m02 * det_21_33 + m03 * det_21_32);
    const cofact_11 = +(m00 * det_22_33 - m02 * det_20_33 + m03 * det_20_32);
    const cofact_12 = -(m00 * det_21_33 - m01 * det_20_33 + m03 * det_20_31);
    const cofact_13 = +(m00 * det_21_32 - m01 * det_20_32 + m02 * det_20_31);

    const cofact_20 = +(m01 * det_12_33 - m02 * det_11_33 + m03 * det_11_32);
    const cofact_21 = -(m00 * det_12_33 - m02 * det_10_33 + m03 * det_10_32);
    const cofact_22 = +(m00 * det_11_33 - m01 * det_10_33 + m03 * det_10_31);
    const cofact_23 = -(m00 * det_11_32 - m01 * det_10_32 + m02 * det_10_31);

    const cofact_30 = -(m01 * det_12_23 - m02 * det_11_23 + m03 * det_11_22);
    const cofact_31 = +(m00 * det_12_23 - m02 * det_10_23 + m03 * det_10_22);
    const cofact_32 = -(m00 * det_11_23 - m01 * det_10_23 + m03 * det_10_21);
    const cofact_33 = +(m00 * det_11_22 - m01 * det_10_22 + m02 * det_10_21);

    Matrix.FromValuesToRef(
      cofact_00 * detInv,
      cofact_10 * detInv,
      cofact_20 * detInv,
      cofact_30 * detInv,
      cofact_01 * detInv,
      cofact_11 * detInv,
      cofact_21 * detInv,
      cofact_31 * detInv,
      cofact_02 * detInv,
      cofact_12 * detInv,
      cofact_22 * detInv,
      cofact_32 * detInv,
      cofact_03 * detInv,
      cofact_13 * detInv,
      cofact_23 * detInv,
      cofact_33 * detInv,
      other,
    );

    return this;
  }

  /**
   * Copy the current matrix from the given one
   * @param other defines the source matrix
   * @returns the current updated matrix
   */
  public copyFrom(other: DeepImmutable<Matrix>): Matrix {
    other.copyToArray(this._m);
    const o = other as Matrix;
    this._updateIdentityStatus(o._isIdentity, o._isIdentityDirty, o._isIdentity3x2, o._isIdentity3x2Dirty);
    return this;
  }

  /**
   * Populates the given array from the starting index with the current matrix values
   * @param array defines the target array
   * @param offset defines the offset in the target array where to start storing values
   * @returns the current matrix
   */
  public copyToArray(array: Float32Array, offset: number = 0): Matrix {
    let source = this._m;
    array[offset] = source[0];
    array[offset + 1] = source[1];
    array[offset + 2] = source[2];
    array[offset + 3] = source[3];
    array[offset + 4] = source[4];
    array[offset + 5] = source[5];
    array[offset + 6] = source[6];
    array[offset + 7] = source[7];
    array[offset + 8] = source[8];
    array[offset + 9] = source[9];
    array[offset + 10] = source[10];
    array[offset + 11] = source[11];
    array[offset + 12] = source[12];
    array[offset + 13] = source[13];
    array[offset + 14] = source[14];
    array[offset + 15] = source[15];

    return this;
  }

  /**
   * Sets the given matrix "result" with the multiplication result of the current Matrix and the given one
   * @param other defines the second operand
   * @param result defines the matrix where to store the multiplication
   * @returns the current matrix
   */
  public multiplyToRef(other: DeepImmutable<Matrix>, result: Matrix): Matrix {
    if (this._isIdentity) {
      result.copyFrom(other);
      return this;
    }
    if ((other as Matrix)._isIdentity) {
      result.copyFrom(this);
      return this;
    }

    this.multiplyToArray(other, result._m, 0);
    result._markAsUpdated();
    return this;
  }

  /**
   * Sets the Float32Array "result" from the given index "offset" with the multiplication of the current matrix and the given one
   * @param other defines the second operand
   * @param result defines the array where to store the multiplication
   * @param offset defines the offset in the target array where to start storing values
   * @returns the current matrix
   */
  public multiplyToArray(other: DeepImmutable<Matrix>, result: Float32Array, offset: number): Matrix {
    const m = this._m;
    const otherM = other.m;
    var tm0 = m[0],
      tm1 = m[1],
      tm2 = m[2],
      tm3 = m[3];
    var tm4 = m[4],
      tm5 = m[5],
      tm6 = m[6],
      tm7 = m[7];
    var tm8 = m[8],
      tm9 = m[9],
      tm10 = m[10],
      tm11 = m[11];
    var tm12 = m[12],
      tm13 = m[13],
      tm14 = m[14],
      tm15 = m[15];

    var om0 = otherM[0],
      om1 = otherM[1],
      om2 = otherM[2],
      om3 = otherM[3];
    var om4 = otherM[4],
      om5 = otherM[5],
      om6 = otherM[6],
      om7 = otherM[7];
    var om8 = otherM[8],
      om9 = otherM[9],
      om10 = otherM[10],
      om11 = otherM[11];
    var om12 = otherM[12],
      om13 = otherM[13],
      om14 = otherM[14],
      om15 = otherM[15];

    result[offset] = tm0 * om0 + tm1 * om4 + tm2 * om8 + tm3 * om12;
    result[offset + 1] = tm0 * om1 + tm1 * om5 + tm2 * om9 + tm3 * om13;
    result[offset + 2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
    result[offset + 3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;

    result[offset + 4] = tm4 * om0 + tm5 * om4 + tm6 * om8 + tm7 * om12;
    result[offset + 5] = tm4 * om1 + tm5 * om5 + tm6 * om9 + tm7 * om13;
    result[offset + 6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
    result[offset + 7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;

    result[offset + 8] = tm8 * om0 + tm9 * om4 + tm10 * om8 + tm11 * om12;
    result[offset + 9] = tm8 * om1 + tm9 * om5 + tm10 * om9 + tm11 * om13;
    result[offset + 10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
    result[offset + 11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;

    result[offset + 12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
    result[offset + 13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
    result[offset + 14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
    result[offset + 15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
    return this;
  }
}

/**
 * @hidden
 * Same as Tmp but not exported to keep it only for math functions to avoid conflicts
 */
class MathTmp {
  public static Vector3: Vector3[] = ArrayTools.BuildArray(6, Vector3.Zero);
  public static Matrix: Matrix[] = ArrayTools.BuildArray(2, Matrix.Identity);
}
