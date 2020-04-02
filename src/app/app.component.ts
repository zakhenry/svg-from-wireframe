import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  Pipe,
  PipeTransform,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Material,
  Scene,
  StandardMaterial,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core';
import { fromWorker } from 'observable-webworker';
import { BehaviorSubject, concat, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { exhaustMap, filter, map, mergeMap, pairwise, switchMap, take, tap } from 'rxjs/operators';
import { MeshToSvgWorkerPayload } from 'wireframe-svg';
import { createMeshPair, MeshPairData } from './load-mesh';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  constructor(
    private zone: NgZone,
    private http: HttpClient,
    private renderer: Renderer2,
  ) {}
  public title = 'wireframe-svg-demo';
  public svgVisible = true;

  public triggerRender$ = new ReplaySubject(1);

  public continuousRender$ = new BehaviorSubject(false);

  public workerInput$: Subject<MeshToSvgWorkerPayload> = new Subject();

  public workerOutput$: Observable<string> = this.workerInput$.pipe(
    exhaustMap(input => {
      return fromWorker<MeshToSvgWorkerPayload, string>(
        () => new Worker('./mesh-to-svg.worker', { type: 'module' }),
        of(input),
        i => [
          i.mesh.positions.buffer,
          i.mesh.indices.buffer,
          i.mesh.normals.buffer,
          i.wireframe.positions.buffer,
          i.wireframe.indices.buffer,
        ],
      ).pipe(take(1));
    }),
  );

  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('svg') svg: ElementRef;

  public svg$: Observable<string> = concat(
    of(null),
    this.workerOutput$.pipe(
      map(svg => {
        return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      }),
    ),
    pairwise(),
    map(([previous, current]) => {
      if (previous) {
        setTimeout(() => URL.revokeObjectURL(previous));
      }

      return current;
    }),
    filter(url => !!url),
  );

  public toggleSvgVisible(): void {
    this.svgVisible = !this.svgVisible;
  }

  public toggleContinuousRender(): void {
    this.continuousRender$.next(!this.continuousRender$.value);
  }

  public triggerRender(): void {
    this.triggerRender$.next();
  }

  public ngAfterViewInit() {
    const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;

    const engine = new Engine(canvasElement, true);

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
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
    camera.useAutoRotationBehavior = false;

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

    const render$ = concat(
      of(null),
      new Observable(observer => {
        const ref = camera.onViewMatrixChangedObservable.add(() => observer.next());
        return () => camera.onViewMatrixChangedObservable.remove(ref);
      }),
    );

    this.zone.runOutsideAngular(() => engine.runRenderLoop(() => scene.render()));

    // const model = 'slotted-cube';
    const model = 'raspi';
    // const model = 'diamond';
    // const model = 'brick';
    // const model = 'silhouette';
    // const model = 'blobular-intersection';
    // const model = 'cylinder';
    // const model = 'inside-outside-cylinder';
    // const model = 'varying-normals';

    this.http
      .get<MeshPairData>(`/assets/${model}.json`)
      .pipe(
        tap(res => {
          const { mesh, edgesMesh } = createMeshPair(scene, res);
          edgesMesh.color = Color3.White();
          edgesMesh.parent = mesh;

          const material = new StandardMaterial(res.id + 'mat', scene);
          material.diffuseColor = Color3.White();
          material.sideOrientation = Material.CounterClockWiseSideOrientation;
          material.alpha = 0.5;
          mesh.material = material;

          mesh.rotate(Vector3.Left(), Math.PI / 2);

          this.continuousRender$
            .pipe(
              switchMap(continuousRender => (continuousRender ? render$ : this.triggerRender$)),
              tap(() => {
                const inputRender: MeshToSvgWorkerPayload = {
                  mesh: {
                    positions: mesh.getVerticesData(VertexBuffer.PositionKind, true, true) as Float32Array,
                    indices: Uint32Array.from(mesh.getIndices()),
                    normals: mesh.getVerticesData(VertexBuffer.NormalKind, true, true) as Float32Array,
                  },
                  wireframe: {
                    positions: edgesMesh.getVerticesData(VertexBuffer.PositionKind, true, true) as Float32Array,
                    indices: Uint32Array.from(edgesMesh.getIndices()),
                  },
                  meshWorldMatrix: mesh.getWorldMatrix().toArray() as Float32Array,
                  sceneTransformMatrix: scene.getTransformMatrix().toArray() as Float32Array,
                  sceneViewMatrix: scene.getViewMatrix().toArray() as Float32Array,
                  sceneProjectionMatrix: scene.getProjectionMatrix().toArray() as Float32Array,
                  viewport: scene.activeCamera.viewport,
                  cameraForwardVector: Float32Array.from((scene.activeCamera as ArcRotateCamera).getFrontPosition(1).asArray()),
                  width: scene.getEngine().getRenderWidth(),
                  height: scene.getEngine().getRenderHeight(),
                };

                this.workerInput$.next(inputRender);
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();

  }

  public saveSvg(url: SafeUrl) {
    const link = this.renderer.createElement('a');
    link.style.display = 'none';
    link.href = (url as any).changingThisBreaksApplicationSecurity;
    link.download = 'wireframe.svg';
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }));
  }
}

@Pipe({
  name: 'safeUrl',
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  public transform(url: string): SafeUrl {
    return this.domSanitizer.bypassSecurityTrustUrl(url);
  }
}
