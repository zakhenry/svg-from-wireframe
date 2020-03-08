import './babylon-shim.worker';
import { DoWork, ObservableWorker } from 'observable-webworker';
import { Observable } from 'rxjs';
import { MeshToSvgWorkerPayload } from 'wireframe-svg';
import { MeshToSvg } from '../../projects/wireframe-svg/src/lib/mesh-to-svg';

@ObservableWorker()
export class MeshToSvgWorker implements DoWork<MeshToSvgWorkerPayload, string> {
  public work(input$: Observable<MeshToSvgWorkerPayload>): Observable<string> {
    return new MeshToSvg().run(input$);
  }
}
