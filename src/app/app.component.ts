import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Material,
  Matrix,
  MeshBuilder, Plane,
  Ray,
  Scene,
  StandardMaterial,
  Vector2,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core';
import { Observable, Subject } from 'rxjs';
import { map, startWith, switchAll, tap } from 'rxjs/operators';
import { getIntersectionPointFast } from './compute-intersection';
import { dedupeLines } from './dedupe-lines';
import { LineSegment } from './interfaces';
import { createMeshPair, MeshPairData } from './load-mesh';


interface SvgLines {
  obscured: LineSegment[]  ;
  visible: LineSegment[]  ;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  title = 'wireframe-svg-maker';

  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('svg') svg: ElementRef;

  constructor(private zone: NgZone, private http: HttpClient, private renderer: Renderer2) {
  }

  private lines$$ = new Subject();
  public lines$: Observable<SvgLines> = this.lines$$.pipe(switchAll());

  public ngAfterViewInit() {

    const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;

    const engine = new Engine(canvasElement, true);

    const scene = new Scene(engine);
    scene.clearColor = new Color4(1, 1, 1, 1);
    scene.useRightHandedSystem = true;

    const camera = new ArcRotateCamera(
      'ArcRotateCamera',
      Math.PI - Math.PI / 4,
      Math.PI / 3,
      200,
      new Vector3(0, 0, 0),
      scene,
    );

    // min zoom
    camera.lowerRadiusLimit = 10;
    // max zoom
    camera.upperRadiusLimit = 1500;
    camera.inertia = 0.3;
    camera.angularSensibilityX = 500;
    camera.angularSensibilityY = 500;
    camera.panningInertia = 0;
    camera.panningSensibility = 10;
    camera.useAutoRotationBehavior = false;
    camera.wheelPrecision = 0.5;
    camera.attachControl(canvasElement, false, true, 1);
    // (camera.inputs.attached.pointers as any).buttons = [1, 2];

    const ortho = true;
    if (ortho) {

      camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

      camera.minZ = -10000;
      camera.maxZ = 10000;
      let orthoFrustrum = 20;
      const ratio = canvasElement.clientWidth / canvasElement.clientHeight;
      const computeOrthoCameraView = () => {
        camera.orthoLeft = (-ratio * orthoFrustrum) / 2;
        camera.orthoRight = (ratio * orthoFrustrum) / 2;
        camera.orthoTop = orthoFrustrum / 2;
        camera.orthoBottom = -orthoFrustrum / 2;
      };

      computeOrthoCameraView();

      const wheelListener = (e: WheelEvent) => {
        const newFrustrum = orthoFrustrum * (e.deltaY > 0 ? 1.1 : 0.9);
        if (newFrustrum < camera.upperRadiusLimit && newFrustrum > camera.lowerRadiusLimit) {
          orthoFrustrum = newFrustrum;
          computeOrthoCameraView();
        }
      };

      canvasElement.addEventListener('wheel', wheelListener, false);
    }

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    const render$ = new Observable(observer => {
      const ref = camera.onViewMatrixChangedObservable.add(() => observer.next());
      return () => camera.onViewMatrixChangedObservable.remove(ref);
    }).pipe(startWith(null));

    this.zone.runOutsideAngular(() => engine.runRenderLoop(() => scene.render()));


    const model = 'slotted-cube';
    // const model = 'raspi';

    this.http.get<MeshPairData>(`/assets/${model}.json`).pipe(tap((res) => {

      const { mesh, edgesMesh } = createMeshPair(scene, res);
      edgesMesh.color = Color3.Black();
      edgesMesh.parent = mesh;

      const material = new StandardMaterial(res.id + 'mat', scene);
      material.diffuseColor = Color3.White();
      material.sideOrientation = Material.CounterClockWiseSideOrientation;
      material.alpha = 0.5;
      mesh.material = material;

      mesh.rotate(Vector3.Left(), Math.PI / 2);

      const vertices = edgesMesh.getVerticesData(VertexBuffer.PositionKind);

      const lines: [Vector3, Vector3][] = [];

      for (let i = 0; i < vertices.length; i += 6) {

        lines.push([
          new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]),
          new Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]),
        ]);

      }

      const nowhere = new Vector3(1000, 1000, 1000);
      const intersectionMeshes = Array.from({ length: lines.length * 2 }).map((_, i) => {
        const mesh = MeshBuilder.CreateBox('intersection' + i, { size: .3 });
        mesh.position = nowhere;
        mesh.parent = edgesMesh;
        return mesh;
      });

      this.lines$$.next(render$.pipe(map(() => {
        const worldMatrix = edgesMesh.getWorldMatrix();
        const transformMatrix = scene.getTransformMatrix();
        const viewport = scene.activeCamera.viewport;

        const projectedLines = lines.map((viewSpace, i) => {

          const screenSpace = viewSpace.map((v, j) => {

            const coordinates = Vector3.Project(v, worldMatrix, transformMatrix, viewport);

            const start = Vector3.Unproject(
              new Vector3(coordinates.x * canvasElement.clientWidth, coordinates.y * canvasElement.clientHeight, 0),
              engine.getRenderWidth(),
              engine.getRenderHeight(),
              Matrix.Identity(),
              scene.getViewMatrix(),
              scene.getProjectionMatrix(),
            );

            const ray = Ray.CreateNewFromTo(start, Vector3.TransformCoordinates(v, worldMatrix));

            // if (i == 0 && j == 0) {
            //   RayHelper.CreateAndShow(ray, scene, new Color3(0, 0, 0.8));
            // }

            const pick = ray.intersectsMesh(mesh as any);

            // camera      pick  point
            // X-----------|-----*
            if (pick.hit && ray.length - pick.distance > 0.01) {
              intersectionMeshes[i * 2 + j].position = nowhere;
            } else {
              intersectionMeshes[i * 2 + j].position = v;
            }

            return new Vector2(
              canvasElement.width * coordinates.x,
              canvasElement.height * coordinates.y,
            );
          }) as LineSegment;

          return {screenSpace, viewSpace};

        }).filter((line, i, allLines) => dedupeLines(line.screenSpace, i, allLines.map(l => l.screenSpace)))

        // const intersections: Vector2[] = [];
        const intersectionsMap: Map<number, Vector2[]> = new Map();

        // eep, this is O(N^2)
        for (let b = 0; b < projectedLines.length; b++) {

          for (let a = b + 1; a < projectedLines.length; a++) {

            const lineA = projectedLines[a].screenSpace;
            const lineB = projectedLines[b].screenSpace;

            const intersection = getIntersectionPointFast(lineA, lineB);

            if (intersection) {
              [a, b].forEach(p => {
                if (!intersectionsMap.has(p)) {
                  intersectionsMap.set(p, []);
                }
                intersectionsMap.get(p).push(intersection);
              });
              // intersections.push(intersection);
            }

          }

        }

        // console.log(intersectionsMap);

        const culled = projectedLines.flatMap((projected, index) => {

          const line = projected.screenSpace;

          const sortedIntersections = !intersectionsMap.has(index) ? [] : intersectionsMap.get(index).map(intersection => {
            return {
              intersection, distance: Vector2.DistanceSquared(line[0], intersection),
            };
          })
            .sort((a, b) => a.distance - b.distance)
            .map(i => i.intersection);

          const candidateNodes: Vector2[] = [line[0], ...sortedIntersections, line[1]];

          let currentObscured = null;

          const results: Array<{obscured: boolean, line: LineSegment}> = [];

          let currentCandidate: LineSegment = [candidateNodes[0], candidateNodes[1]];

          candidateNodes.forEach((node, i, allNodes) => {

            if (i===allNodes.length-1) {
              return;
            }

            const testLine: LineSegment = [node, allNodes[i+1]];
            const obscured = i % 2 === 0; // @todo test if actually obscured

            if (currentObscured === null) {
              currentObscured = obscured;
            }

            if (obscured != currentObscured) {
              results.push({line: currentCandidate, obscured: currentObscured});
              currentObscured = obscured;
              currentCandidate = testLine;
            } else {
              // extend current candidate
              currentCandidate[1] = testLine[1]
            }

          });

          results.push({line: currentCandidate, obscured: currentObscured});

          return results;

        });

      return culled.reduce((svgLines: SvgLines, line) => {

        if (line.obscured) {
          svgLines.obscured.push(line.line)
        } else {
          svgLines.visible.push(line.line)
        }

        return svgLines;

      }, { visible: [], obscured: []});

      })));


    })).subscribe();

  }

  public saveSvg() {
    console.log({ svg: this.svg.nativeElement });

    const blob = new Blob(
      [this.svg.nativeElement.outerHTML],
      {
        type: 'text/plain;charset=utf-8',
      },
    );

    const link = this.renderer.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = 'wireframe.svg';
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }));
  }
}
