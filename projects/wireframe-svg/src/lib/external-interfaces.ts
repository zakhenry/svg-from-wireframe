type MatrixData = Float32Array;
type Vector3Data = Float32Array;

export interface TriangleMesh {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

export interface LinesMesh {
  positions: Float32Array;
  indices: Uint32Array;
}

export interface SvgLineConfig {
  strokeWidth?: number;
  color?: string;
}

export interface SvgConfig {
  // width of the output SVG
  width?: number;
  // height of the output SVG
  height?: number;
  // whether to fit all the output lines within the bounds of the svg.
  // If false, the overflowing lines from source canvas are preserved. Default true
  fitLines?: boolean;
  // margin of clear space around the object - default is 100px, the value is ignored if fitLines = false
  margin?: number;
  // configuration of the visible lines. Default is black
  visible?: SvgLineConfig;
  // null if the occluded lines should not be shown. Default is grey
  obscured?: SvgLineConfig | null;
}

export interface MeshToSvgWorkerPayload {
  // triangle mesh to render
  mesh: TriangleMesh;
  // optional set of lines that define the mesh. Edges will still be computed and added to the pool of candidate lines
  wireframe?: LinesMesh;
  // transformation of the mesh
  meshWorldMatrix: MatrixData;
  // transformation of the scene
  sceneTransformMatrix: MatrixData;
  sceneViewMatrix: MatrixData;
  sceneProjectionMatrix: MatrixData;
  // @deprecated, no longer used
  viewport?: { x: number; y: number; width: number; height: number };
  // @deprecated - this field is no longer required (it is now derived from sceneViewMatrix)
  cameraForwardVector?: Vector3Data;
  // width of the source (usually the canvas that the mesh is being rendered to)
  sourceWidth: number;
  // height of the source (usually the canvas that the mesh is being rendered to)
  sourceHeight: number;
  // allows control of the output appearance, scaling etc of the svg.
  svgConfig?: SvgConfig;
}
