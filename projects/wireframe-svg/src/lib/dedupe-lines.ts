import { ProjectedLine } from './interfaces';

export function dedupeLines(projectedLines: ProjectedLine[]): ProjectedLine[] {
  return projectedLines.filter((line, index) => {
    for (let i = index + 1; i < projectedLines.length; i++) {
      const compare = projectedLines[i].screenSpace;
      if (line.screenSpace[0].equalsWithEpsilon(compare[0]) && line.screenSpace[1].equalsWithEpsilon(compare[1])) {
        return false;
      }

      if (line.screenSpace[0].equalsWithEpsilon(compare[1]) && line.screenSpace[1].equalsWithEpsilon(compare[0])) {
        return false;
      }
    }

    return true;
  });
}
