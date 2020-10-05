import { combineLatest, from } from 'rxjs';
import { map } from 'rxjs/operators';

class MeshToSvg {
    run(input$) {
        return combineLatest([from(import('mesh-to-svg')), input$]).pipe(map(([wasm, input]) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const wasmSvg = wasm.mesh_to_svg_lines(input.sourceWidth, input.sourceHeight, input.mesh.indices, input.mesh.positions, input.mesh.normals, (_a = input.wireframe) === null || _a === void 0 ? void 0 : _a.indices, (_b = input.wireframe) === null || _b === void 0 ? void 0 : _b.positions, input.sceneViewMatrix, input.sceneProjectionMatrix, input.meshWorldMatrix, (_c = input.svgConfig) === null || _c === void 0 ? void 0 : _c.width, (_d = input.svgConfig) === null || _d === void 0 ? void 0 : _d.height, (_e = input.svgConfig) === null || _e === void 0 ? void 0 : _e.margin, (_g = (_f = input.svgConfig) === null || _f === void 0 ? void 0 : _f.visible) === null || _g === void 0 ? void 0 : _g.strokeWidth, (_j = (_h = input.svgConfig) === null || _h === void 0 ? void 0 : _h.visible) === null || _j === void 0 ? void 0 : _j.color, ((_k = input.svgConfig) === null || _k === void 0 ? void 0 : _k.obscured) === null, (_m = (_l = input.svgConfig) === null || _l === void 0 ? void 0 : _l.obscured) === null || _m === void 0 ? void 0 : _m.strokeWidth, (_p = (_o = input.svgConfig) === null || _o === void 0 ? void 0 : _o.obscured) === null || _p === void 0 ? void 0 : _p.color, (_q = input.svgConfig) === null || _q === void 0 ? void 0 : _q.fitLines);
            return wasmSvg;
        }));
    }
}

/*
 * Public API Surface of wireframe-svg
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MeshToSvg };
//# sourceMappingURL=wireframe-to-svg.js.map
