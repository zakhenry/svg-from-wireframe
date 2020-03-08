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

type MatrixData = Float32Array;

type Vector3Data = number[];

export interface MeshToSvgWorkerPayload {
  mesh: {
    positions: Float32Array,
    indices: Int32Array,
    normals: Float32Array,
  }
  wireframe: {
    positions: Float32Array,
    indices: Int32Array,
  }
  meshWorldMatrix: MatrixData,
  sceneTransformMatrix: MatrixData,
  sceneViewMatrix: MatrixData,
  sceneProjectionMatrix: MatrixData,
  viewport: {x: number, y: number, width: number, height: number},
  cameraForwardVector: Vector3Data,
  width: number, height: number,
}
