import { LineSegment } from './interfaces';

export function dedupeLines(line: LineSegment, index: number, lines: LineSegment[]): boolean {

  for(let i = index + 1; i<lines.length; i++) {
    const compare = lines[i];
    if (line[0].equalsWithEpsilon(compare[0]) && line[1].equalsWithEpsilon(compare[1])) {
      return false;
    }

    if (line[0].equalsWithEpsilon(compare[1]) && line[1].equalsWithEpsilon(compare[0])) {
      return false;
    }
  }

  return true;

}
