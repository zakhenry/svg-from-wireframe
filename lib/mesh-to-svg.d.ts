import { Observable } from 'rxjs';
import { MeshToSvgWorkerPayload } from './external-interfaces';
export declare class MeshToSvg {
    run(input$: Observable<MeshToSvgWorkerPayload>): Observable<string>;
}
