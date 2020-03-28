import { getRayIntersection } from './get-ray-intersection';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MeshToSvgWorkerPayload } from './external-interfaces';
import { getSilhouetteCandidates } from './find-silhouette-lines';
import { EdgeCandidate, LineSegment3D } from './interfaces';
import { Matrix, Vector3 } from './Maths/vector';
import { Viewport } from './Maths/viewport';
import { viewSpaceLinesToScreenSpaceLines } from './mesh-to-screen-space';
import { screenSpaceLinesToFittedSvg } from './screen-space-lines-to-svg';

export class MeshToSvg {
  private silhouetteCandidates: EdgeCandidate[];
  private wireframeLines: LineSegment3D[];

  public prepare(input: MeshToSvgWorkerPayload): void {
    this.silhouetteCandidates = getSilhouetteCandidates(input.mesh.indices, input.mesh.positions);
    this.wireframeLines = this.getWireframeLines(input.wireframe.positions);
  }

  public render(input: MeshToSvgWorkerPayload): string {
    const meshWorldMatrix = Matrix.FromArray(input.meshWorldMatrix);

    const sceneTransformMatrix = Matrix.FromArray(input.sceneTransformMatrix);
    const sceneViewMatrix = Matrix.FromArray(input.sceneViewMatrix);
    const sceneProjectionMatrix = Matrix.FromArray(input.sceneProjectionMatrix);
    const viewport = new Viewport(input.viewport.x, input.viewport.y, input.viewport.width, input.viewport.height);
    const cameraForwardVector = Vector3.FromArray(input.cameraForwardVector);
    const width = input.width;
    const height = input.height;
    const isObscured = ray => {
      const pick = getRayIntersection(ray, input.mesh.positions, input.mesh.indices, meshWorldMatrix);

      return pick !== null && ray.length - pick > 0.01;
    };

    const screenSpaceLines = viewSpaceLinesToScreenSpaceLines(
      this.wireframeLines,
      this.silhouetteCandidates,
      meshWorldMatrix,
      sceneTransformMatrix,
      sceneViewMatrix,
      sceneProjectionMatrix,
      viewport,
      cameraForwardVector,
      width,
      height,
      isObscured,
    );

    const svg = screenSpaceLinesToFittedSvg(screenSpaceLines);

    return svg;
  }

  public run(input$: Observable<MeshToSvgWorkerPayload>): Observable<string> {
    return input$.pipe(
      map((input: MeshToSvgWorkerPayload) => {
        this.prepare(input);
        return this.render(input);
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
