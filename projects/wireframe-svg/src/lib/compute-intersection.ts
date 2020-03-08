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

  const p0x = p0.x;
  const p0y = p0.y;
  const p1x = p1.x;
  const p1y = p1.y;
  const p2x = p2.x;
  const p2y = p2.y;
  const p3x = p3.x;
  const p3y = p3.y;

  const s1x = p1x - p0x;
  const s1y = p1y - p0y;
  const s2x = p3x - p2x;
  const s2y = p3y - p2y;

  const s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / (-s2x * s1y + s1x * s2y);
  const t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / (-s2x * s1y + s1x * s2y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    return new Vector2(p0x + t * s1x, p0y + t * s1y);
  }

  return false; // No collision
}
