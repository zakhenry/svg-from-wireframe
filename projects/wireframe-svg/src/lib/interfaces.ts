import { Vector2, Vector3 } from '@babylonjs/core';

export type LineSegment = [Vector2, Vector2];

export type LineSegment3D = [Vector3, Vector3];

export interface ProjectedLine {
  screenSpace: LineSegment;
  viewSpace: LineSegment3D;
}

export interface EdgeCandidate {
  edge: LineSegment3D;
  adjacentTriangleANormal: Vector3;
  adjacentTriangleBNormal: Vector3;
}
