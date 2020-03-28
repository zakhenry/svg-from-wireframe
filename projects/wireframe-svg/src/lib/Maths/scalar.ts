/**
 * Scalar computation library
 */
export class Scalar {
  /**
   * Boolean : true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
   * @param a number
   * @param b number
   * @param epsilon (default = 1.401298E-45)
   * @returns true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
   */
  public static WithinEpsilon(a: number, b: number, epsilon: number = 1.401298e-45): boolean {
    let num = a - b;
    return -epsilon <= num && num <= epsilon;
  }
}
