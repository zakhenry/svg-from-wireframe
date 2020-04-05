import { combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MeshToSvgWorkerPayload } from './external-interfaces';

export class MeshToSvg {
  public run(input$: Observable<MeshToSvgWorkerPayload>): Observable<string> {
    return combineLatest([from(import('wasm-svg-from-wireframe')), input$]).pipe(
      map(([wasm, input]) => {
        const wasmSvg = wasm.mesh_to_svg_lines(
          input.sourceWidth,
          input.sourceHeight,
          input.mesh.indices,
          input.mesh.positions,
          input.mesh.normals,
          input.wireframe.indices,
          input.wireframe.positions,
          input.sceneViewMatrix,
          input.sceneProjectionMatrix,
          input.meshWorldMatrix,
          input.cameraForwardVector,
          input.svgConfig?.width,
          input.svgConfig?.height,
          input.svgConfig?.margin,
          input.svgConfig?.visible?.strokeWidth,
          input.svgConfig?.visible?.color,
          input.svgConfig?.obscured === null,
          input.svgConfig?.obscured?.strokeWidth,
          input.svgConfig?.obscured?.color,
          input.svgConfig?.fitLines,
        );

        return wasmSvg;
      }),
    );
  }
}
