import { Vector2 } from '@babylonjs/core';
import { dedupeLines } from './dedupe-lines';
import { LineSegment } from './interfaces';

describe('dedupe lines', () => {

  it('should remove exact duplicated lines', () => {

    const a: LineSegment = [new Vector2(30, 0), new Vector2(40, 0)];

    const lines = [a, a, a];

    const filtered = lines.filter(dedupeLines);

    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(a);

  });

  it('should remove duplicated but reversed lines', () => {
    const a: LineSegment = [new Vector2(30, 0), new Vector2(40, 0)];
    const b: LineSegment = [a[1], a[0]];

    const lines = [a, b];

    const filtered = lines.filter(dedupeLines);

    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(b);
  });

});
