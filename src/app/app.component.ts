import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import {
  ArcRotateCamera,
  Camera,
  Engine,
  HemisphericLight,
  Matrix,
  MeshBuilder,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { Observable, Subject } from 'rxjs';
import { map, switchAll } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  title = 'wireframe-svg-maker';

  @ViewChild('canvas') canvas: ElementRef;

  constructor(private zone: NgZone) {
  }

  private pointerPos$$ = new Subject();
  public pointerPos$ = this.pointerPos$$.pipe(switchAll());

  public ngAfterViewInit() {

    const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;

    const engine = new Engine(canvasElement, true);

    const scene = new Scene(engine);

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
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    (camera.inputs.attached.pointers as any).buttons = [1, 2];

    camera.minZ = -10000;
    camera.maxZ = 10000;
    let orthoFrustrum = 200;
    const ratio = canvasElement.clientWidth / canvasElement.clientHeight;
    const computeOrthoCameraView = () => {
      camera.orthoLeft = (-ratio * orthoFrustrum) / 2;
      camera.orthoRight = (ratio * orthoFrustrum) / 2;
      camera.orthoTop = orthoFrustrum / 2;
      camera.orthoBottom = -orthoFrustrum / 2;
    };

    canvasElement.addEventListener('click', () => {
      // We try to pick an object
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);

      console.log(`pickResult`, pickResult);

    });

    computeOrthoCameraView();

    const wheelListener = (e: WheelEvent) => {
      const newFrustrum = orthoFrustrum * (e.deltaY > 0 ? 1.1 : 0.9);
      if (newFrustrum < camera.upperRadiusLimit && newFrustrum > camera.lowerRadiusLimit) {
        orthoFrustrum = newFrustrum;
        computeOrthoCameraView();
      }
    };

    canvasElement.addEventListener('wheel', wheelListener, false);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 20, segments: 32 }, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 10;

    // Our built-in 'ground' shape.
    MeshBuilder.CreateGround('ground', { width: 60, height: 60 }, scene);

    const point = MeshBuilder.CreateSphere('sphere', { diameter: 5, segments: 8 }, scene);
    point.position = new Vector3(200, 40, 50);

    const render$ = new Observable(observer => {
      const ref = scene.onAfterRenderObservable.add(() => observer.next());
      return () => scene.onAfterRenderObservable.remove(ref);
    });

    this.pointerPos$$.next(render$.pipe(map(() => {
      const worldMatrix = Matrix.Identity() || point.getWorldMatrix();
      const transformMatrix = scene.getTransformMatrix();
      const viewport = scene.activeCamera.viewport;
      const coordinates = Vector3.Project(point.position, worldMatrix, transformMatrix, viewport);

      return {
        x: canvasElement.width * coordinates.x,
        y: canvasElement.height * coordinates.y,
      };
    })));

    this.zone.runOutsideAngular(() => engine.runRenderLoop(() => scene.render()));

  }

}
