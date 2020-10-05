import { __read } from 'tslib';
import { combineLatest, from } from 'rxjs';
import { map } from 'rxjs/operators';

var MeshToSvg = /** @class */ (function () {
    function MeshToSvg() {
    }
    MeshToSvg.prototype.run = function (input$) {
        return combineLatest([from(import('mesh-to-svg')), input$]).pipe(map(function (_a) {
            var _b = __read(_a, 2), wasm = _b[0], input = _b[1];
            var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            var wasmSvg = wasm.mesh_to_svg_lines(input.sourceWidth, input.sourceHeight, input.mesh.indices, input.mesh.positions, input.mesh.normals, (_c = input.wireframe) === null || _c === void 0 ? void 0 : _c.indices, (_d = input.wireframe) === null || _d === void 0 ? void 0 : _d.positions, input.sceneViewMatrix, input.sceneProjectionMatrix, input.meshWorldMatrix, (_e = input.svgConfig) === null || _e === void 0 ? void 0 : _e.width, (_f = input.svgConfig) === null || _f === void 0 ? void 0 : _f.height, (_g = input.svgConfig) === null || _g === void 0 ? void 0 : _g.margin, (_j = (_h = input.svgConfig) === null || _h === void 0 ? void 0 : _h.visible) === null || _j === void 0 ? void 0 : _j.strokeWidth, (_l = (_k = input.svgConfig) === null || _k === void 0 ? void 0 : _k.visible) === null || _l === void 0 ? void 0 : _l.color, ((_m = input.svgConfig) === null || _m === void 0 ? void 0 : _m.obscured) === null, (_p = (_o = input.svgConfig) === null || _o === void 0 ? void 0 : _o.obscured) === null || _p === void 0 ? void 0 : _p.strokeWidth, (_r = (_q = input.svgConfig) === null || _q === void 0 ? void 0 : _q.obscured) === null || _r === void 0 ? void 0 : _r.color, (_s = input.svgConfig) === null || _s === void 0 ? void 0 : _s.fitLines);
            return wasmSvg;
        }));
    };
    return MeshToSvg;
}());

/*
 * Public API Surface of wireframe-svg
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MeshToSvg };
//# sourceMappingURL=wireframe-to-svg.js.map
