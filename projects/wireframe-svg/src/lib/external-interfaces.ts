type MatrixData = Float32Array;

type Vector3Data = number[];

export interface TriangleMesh {
  positions: Float32Array;
  indices: Int32Array;
  normals: Float32Array;
}

export interface LinesMesh {
  positions: Float32Array;
  indices: Int32Array;
}

export interface SvgLineConfig {
  strokeWidth: number;
  color: string;
}

export interface SvgConfig {
  width?: number;
  height?: number;
  margin?: number;
  visible?: SvgLineConfig;
  occluded?: SvgLineConfig | null; // null if the occluded lines should not be shown
}

export interface MeshToSvgWorkerPayload {
  mesh: TriangleMesh;
  wireframe?: LinesMesh;
  meshWorldMatrix: MatrixData;
  sceneTransformMatrix: MatrixData;
  sceneViewMatrix: MatrixData;
  sceneProjectionMatrix: MatrixData;
  viewport: { x: number; y: number; width: number; height: number };
  cameraForwardVector: Vector3Data;
  width: number;
  height: number;
  svgConfig?: SvgConfig;
}
