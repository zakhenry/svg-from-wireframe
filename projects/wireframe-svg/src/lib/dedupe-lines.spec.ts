import { Vector2 } from './Maths';
import { dedupeLines } from './dedupe-lines';
import { ProjectedLine } from './interfaces';

describe('dedupe lines', () => {
  it('should remove exact duplicated lines by screenspace segment', () => {
    const a: ProjectedLine = {
      screenSpace: [new Vector2(30, 0), new Vector2(40, 0)],
      viewSpace: null,
    };

    const lines = [a, a, a];

    const filtered = dedupeLines(lines);

    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(a);
  });

  it('should remove duplicated but reversed lines by screenspace segment', () => {
    const a: ProjectedLine = {
      screenSpace: [new Vector2(30, 0), new Vector2(40, 0)],
      viewSpace: null,
    };
    const b: ProjectedLine = {
      screenSpace: [a.screenSpace[1], a.screenSpace[0]],
      viewSpace: null,
    };

    const lines = [a, b];

    const filtered = dedupeLines(lines);

    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(b);
  });
});
