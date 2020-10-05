declare type MatrixData = Float32Array;
declare type Vector3Data = Float32Array;
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
    width?: number;
    height?: number;
    fitLines?: boolean;
    margin?: number;
    visible?: SvgLineConfig;
    obscured?: SvgLineConfig | null;
}
export interface MeshToSvgWorkerPayload {
    mesh: TriangleMesh;
    wireframe?: LinesMesh;
    meshWorldMatrix: MatrixData;
    sceneTransformMatrix: MatrixData;
    sceneViewMatrix: MatrixData;
    sceneProjectionMatrix: MatrixData;
    viewport?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    cameraForwardVector?: Vector3Data;
    sourceWidth: number;
    sourceHeight: number;
    svgConfig?: SvgConfig;
}
export {};
