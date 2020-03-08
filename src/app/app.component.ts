import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
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
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, pairwise, share, startWith, switchAll, switchMap, tap } from 'rxjs/operators';
import { MeshToSvgWorkerInitPayload, MeshToSvgWorkerPayload, MeshToSvgWorkerRenderPayload } from 'wireframe-svg';
import { createMeshPair, MeshPairData } from './load-mesh';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  title = 'wireframe-svg-maker';
  svgVisible = true;

  triggerRender$ = new Subject();

  continousRender$ = new BehaviorSubject(false);

  workerInput$: Subject<MeshToSvgWorkerPayload> = new Subject();
  workerOutput$: Observable<string> = fromWorker(
    () => new Worker('./mesh-to-svg.worker', { type: 'module' }),
    this.workerInput$,
    input => {
      return input.type === 'init' ? [
        input.mesh.positions.buffer,
        input.mesh.indices.buffer,
        input.mesh.normals.buffer,
        input.wireframe.positions.buffer,
        input.wireframe.indices.buffer,
      ] : [];
    })

  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('svg') svg: ElementRef;

  constructor(
    private zone: NgZone,
    private http: HttpClient,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer) {
  }

  public toggleSvgVisible(): void {
    this.svgVisible = !this.svgVisible;
  }

  public toggleContinuousRender(): void {
    this.continousRender$.next(!this.continousRender$.value);
  }

  public triggerRender(): void {
    this.triggerRender$.next();
  }

  private lines$$ = new Subject();
  public lines$: Observable<string> = this.lines$$.pipe(switchAll(), share(), tap<string>(() => {
    this.cd.detectChanges();
  }));

  public svg$: Observable<SafeUrl> = this.workerOutput$.pipe(
    map((svg) => {
      return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    }),
    startWith(null),
    pairwise(),
    map(([previous, current]) => {
      if (previous) {
        setTimeout(() => URL.revokeObjectURL(previous));
      }

      return this.sanitizer.bypassSecurityTrustUrl(current);
    }),
    filter(url => !!url),
  );

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

    const render$ = new Observable(observer => {
      const ref = camera.onViewMatrixChangedObservable.add(() => observer.next());
      return () => camera.onViewMatrixChangedObservable.remove(ref);
    }).pipe(startWith(null));

    this.zone.runOutsideAngular(() => engine.runRenderLoop(() => scene.render()));

    // const model = 'slotted-cube';
    const model = 'raspi';
    // const model = 'diamond';
    // const model = 'brick';
    // const model = 'silhouette';
    // const model = 'blobular-intersection';
    // const model = 'cylinder';
    // const model = 'inside-outside-cylinder';

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

      const inputInit: MeshToSvgWorkerInitPayload = {
        type: 'init',
        mesh: {
          positions: mesh.getVerticesData(VertexBuffer.PositionKind, true, true) as Float32Array,
          indices: Int32Array.from(mesh.getIndices()),
          normals: mesh.getVerticesData(VertexBuffer.NormalKind, true, true) as Float32Array,
        },
        wireframe: {
          positions: edgesMesh.getVerticesData(VertexBuffer.PositionKind, true, true) as Float32Array,
          indices: Int32Array.from(edgesMesh.getIndices()),
        },
      };

      this.workerInput$.next(inputInit);

      this.continousRender$.pipe(
        switchMap(continousRender => continousRender ? render$ : this.triggerRender$),
        tap(() => {

          const inputRender: MeshToSvgWorkerRenderPayload = {
            type: 'render',
            meshWorldMatrix: mesh.getWorldMatrix().toArray() as Float32Array,
            sceneTransformMatrix: scene.getTransformMatrix().toArray() as Float32Array,
            sceneViewMatrix: scene.getViewMatrix().toArray() as Float32Array,
            sceneProjectionMatrix: scene.getProjectionMatrix().toArray() as Float32Array,
            viewport: scene.activeCamera.viewport,
            cameraForwardVector: (scene.activeCamera as ArcRotateCamera).getFrontPosition(1).asArray(),
            width: scene.getEngine().getRenderWidth(), height: scene.getEngine().getRenderHeight(),
          };

          this.workerInput$.next(inputRender);

        })
      ).subscribe();

    })).subscribe();

  }

  public saveSvg(url: SafeUrl) {
    const link = this.renderer.createElement('a');
    link.style.display = 'none';
    link.href = (url as any).changingThisBreaksApplicationSecurity;
    link.download = 'wireframe.svg';
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }));
  }
}
