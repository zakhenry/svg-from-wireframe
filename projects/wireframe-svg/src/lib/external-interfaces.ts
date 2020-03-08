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
