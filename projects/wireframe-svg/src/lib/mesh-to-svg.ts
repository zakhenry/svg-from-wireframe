import { combineLatest, from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MeshToSvgWorkerPayload } from './external-interfaces';
import { getSilhouetteCandidates } from './find-edge-lines';
import { LineSegment3D } from './interfaces';
import { Matrix, Vector3 } from './Maths/vector';
import { Viewport } from './Maths/viewport';
import { viewSpaceLinesToScreenSpaceLines } from './mesh-to-screen-space';
import { screenSpaceLinesToFittedSvg } from './screen-space-lines-to-svg';

export class MeshToSvg {
  public render(input: MeshToSvgWorkerPayload): string {
    const meshWorldMatrix = Matrix.FromArray(input.meshWorldMatrix);

    const sceneTransformMatrix = Matrix.FromArray(input.sceneTransformMatrix);
    const sceneViewMatrix = Matrix.FromArray(input.sceneViewMatrix);
    const sceneProjectionMatrix = Matrix.FromArray(input.sceneProjectionMatrix);
    const viewport = new Viewport(input.viewport.x, input.viewport.y, input.viewport.width, input.viewport.height);
    const cameraForwardVector = Vector3.FromArray(input.cameraForwardVector);
    const width = input.width;
    const height = input.height;

    const silhouetteCandidates = getSilhouetteCandidates(input.mesh.indices, input.mesh.positions, input.mesh.normals);
    const wireframeLines = input.wireframe ? this.getWireframeLines(input.wireframe.positions) : null;

    const screenSpaceLines = viewSpaceLinesToScreenSpaceLines(
      wireframeLines,
      silhouetteCandidates,
      meshWorldMatrix,
      sceneTransformMatrix,
      sceneViewMatrix,
      sceneProjectionMatrix,
      viewport,
      cameraForwardVector,
      width,
      height,
      input.mesh,
    );

    const svg = screenSpaceLinesToFittedSvg(screenSpaceLines, input.svgConfig);

    return svg;
  }

  public run(input$: Observable<MeshToSvgWorkerPayload>): Observable<string> {
    return combineLatest([from(import('wasm-svg-from-wireframe')), input$]).pipe(
      map(([wasm, input]) => {

        debugger;

        if (1) {
          // return this.render(input);
        }

        const wasmSvg = wasm.mesh_to_svg_lines(
          input.width,
          input.height,
          input.mesh.indices,
          input.mesh.positions,
          input.mesh.normals,
          input.wireframe.indices,
          input.wireframe.positions,
          input.sceneTransformMatrix,
          input.sceneViewMatrix,
          input.sceneProjectionMatrix,
          input.meshWorldMatrix,
          input.cameraForwardVector
        );

        return wasmSvg;


      }),
    );
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
