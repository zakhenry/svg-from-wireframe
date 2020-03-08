import { Matrix, Mesh, NullEngine, Scene, Vector3, VertexData, Viewport } from '@babylonjs/core';
import { DoWork, ObservableWorker } from 'observable-webworker';
import { Observable } from 'rxjs';
import { getSilhouetteCandidates } from './find-silhouette-lines';
import { LineSegment3D, MeshToSvgWorkerPayload } from './interfaces';
import { viewSpaceLinesToScreenSpaceLines } from './mesh-to-screen-space';
import { screenSpaceLinesToFittedSvg } from './screen-space-lines-to-svg';
import { map } from 'rxjs/operators';

@ObservableWorker()
export class MeshToSvgWorker implements DoWork<MeshToSvgWorkerPayload, string> {

  public work(input$: Observable<MeshToSvgWorkerPayload>): Observable<string> {

    return input$.pipe(
      map((input: MeshToSvgWorkerPayload) => {

        const scene = this.getScene(input.width, input.height);
        const mesh = this.getMesh(input.mesh, scene);

        const meshWorldMatrix = Matrix.FromArray(input.meshWorldMatrix);
        mesh._worldMatrix = meshWorldMatrix;

        const silhouetteCandidates = getSilhouetteCandidates(input.mesh.indices, input.mesh.positions);
        const wireframeLines = this.getWireframeLines(input.wireframe.positions);

        const sceneTransformMatrix = Matrix.FromArray(input.sceneTransformMatrix);
        const sceneViewMatrix = Matrix.FromArray(input.sceneViewMatrix);
        const sceneProjectionMatrix = Matrix.FromArray(input.sceneProjectionMatrix);
        const viewport = new Viewport(input.viewport.x, input.viewport.y, input.viewport.width, input.viewport.height);
        const cameraForwardVector = Vector3.FromArray(input.cameraForwardVector);
        const width = input.width;
        const height = input.height;
        const isObscured = ray => {
          const pick = ray.intersectsMesh(mesh);

          return pick.hit && (ray.length - pick.distance) > 0.01;
        };

        const screenSpaceLines = viewSpaceLinesToScreenSpaceLines(
          wireframeLines,
          silhouetteCandidates,
          meshWorldMatrix,
          sceneTransformMatrix,
          sceneViewMatrix,
          sceneProjectionMatrix,
          viewport,
          cameraForwardVector,
          width, height,
          isObscured,
        );

        const svg = screenSpaceLinesToFittedSvg(screenSpaceLines);

        return svg;
      }),
    );

  }

  private getMesh(input: MeshToSvgWorkerPayload['mesh'], scene: Scene): Mesh {

    const vertexData = new VertexData();
    vertexData.positions = input.positions;
    vertexData.indices = input.indices;
    vertexData.normals = input.normals;

    const mesh = new Mesh('mesh', scene);

    vertexData.applyToMesh(mesh);
    // mesh._unIndexed = !indices || indices.length === 0;

    return mesh;
  }

  private getScene(width: number, height: number): Scene {

    const engine = new NullEngine({
      renderWidth: width,
      renderHeight: height,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 4
    });

    const scene = new Scene(engine);

    return scene;

  }

  private getWireframeLines(wireframePositions: Float32Array): LineSegment3D[] {

    const lines: LineSegment3D[] = [];

    for (let i = 0; i < wireframePositions.length; i += 6) {

      lines.push([
        new Vector3(wireframePositions[i], wireframePositions[i + 1], wireframePositions[i + 2]),
        new Vector3(wireframePositions[i + 3], wireframePositions[i + 4], wireframePositions[i + 5]),
      ]);

    }

    return lines;

  }

}