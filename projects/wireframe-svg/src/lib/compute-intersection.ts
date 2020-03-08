import { Vector2 } from '@babylonjs/core';
import { LineSegment } from './interfaces';


export function getIntersectionPointFast(lineA: LineSegment, lineB: LineSegment): Vector2 | false {

  // exit early if any of the points are coincident
  if (
    lineA[0].equalsWithEpsilon(lineB[0]) ||
    lineA[0].equalsWithEpsilon(lineB[1]) ||
    lineA[1].equalsWithEpsilon(lineB[0]) ||
    lineA[1].equalsWithEpsilon(lineB[1])
  ) {
    return false;
  }

  const [p0, p1] = lineA;
  const [p2, p3] = lineB;

  const p0_x = p0.x;
  const p0_y = p0.y;
  const p1_x = p1.x;
  const p1_y = p1.y;
  const p2_x = p2.x;
  const p2_y = p2.y;
  const p3_x = p3.x;
  const p3_y = p3.y;

  const s1_x = p1_x - p0_x;
  const s1_y = p1_y - p0_y;
  const s2_x = p3_x - p2_x;
  const s2_y = p3_y - p2_y;

  const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    return new Vector2(p0_x + (t * s1_x), p0_y + (t * s1_y));
  }

  return false; // No collision
}

