import { getIntersectionPointFast } from './compute-intersection';
import { LineSegment } from './interfaces';
import { Vector2 } from './Maths/vector';

describe('intersection', () => {
  //  ----
  //
  //  ----
  it('should return false when lines are parallel', () => {
    const a: LineSegment = [new Vector2(0, 10), new Vector2(10, 10)];
    const b: LineSegment = [new Vector2(0, 0), new Vector2(10, 0)];

    expect(getIntersectionPointFast(a, b)).toBe(false);
  });

  //  \
  //   \
  //
  // ----
  it('should return false when lines are not parallel but do not overlap', () => {
    const a: LineSegment = [new Vector2(5, 20), new Vector2(5, 10)];
    const b: LineSegment = [new Vector2(0, 0), new Vector2(10, 0)];

    expect(getIntersectionPointFast(a, b)).toBe(false);
  });

  //  \ /
  //   X
  //  / \
  it('should return intersection when lines intersect', () => {
    const a: LineSegment = [new Vector2(0, 20), new Vector2(20, 0)];
    const b: LineSegment = [new Vector2(0, 0), new Vector2(20, 20)];

    expect(getIntersectionPointFast(a, b)).toEqual(jasmine.objectContaining({ x: 10, y: 10 }));
  });

  // -~-
  it('should return false when lines are colinear and overlapping', () => {
    const a: LineSegment = [new Vector2(10, 0), new Vector2(30, 0)];
    const b: LineSegment = [new Vector2(0, 0), new Vector2(20, 0)];

    expect(getIntersectionPointFast(a, b)).toBe(false);
  });

  // --  --
  it('should return false when lines are colinear and separate', () => {
    const a: LineSegment = [new Vector2(30, 0), new Vector2(40, 0)];
    const b: LineSegment = [new Vector2(0, 0), new Vector2(20, 0)];

    expect(getIntersectionPointFast(a, b)).toBe(false);
  });

  // ----+
  //     |
  //     |
  it('should return false when lines are joined', () => {
    const a: LineSegment = [new Vector2(10, 10), new Vector2(30, 30)];
    const b: LineSegment = [new Vector2(0, 20), new Vector2(10, 10)];

    expect(getIntersectionPointFast(a, b)).toBe(false);
  });
});
