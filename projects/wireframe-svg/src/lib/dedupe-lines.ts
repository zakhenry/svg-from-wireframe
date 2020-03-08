import { Epsilon, Vector2 } from '@babylonjs/core';
import { LineSegment, ProjectedLine } from './interfaces';

export function dedupeLines(projectedLines: ProjectedLine[]): ProjectedLine[] {

  // const collinearLines = [];
  //
  // const screenSpace = projectedLines.map(p => p.screenSpace);
  //
  // for(let i=0; i<projectedLines.length; i++) {
  //   const maybeCollinear = findCollinear(i, screenSpace, i);
  //
  //   if (maybeCollinear.length) {
  //     collinearLines[i] = maybeCollinear;
  //   }
  //
  // }

  return projectedLines.filter((line, index) => {

    for(let i = index + 1; i<projectedLines.length; i++) {
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

/**
 new plan.

 0. create index of lines
 1. start with first line
 2. find all others in the same axis - set their index to -1 and add to list
 3. sort sub-list by min distance from first line origin
 4. starting with first point, extend (mutably?) it to maximum extend _where overlapping_
 5. when break detected, move to starting a new line
 6. when sub-list exhausted move to next line in index (where >-1)
 7. return all created lines

*/

function isCollinear(a: Vector2, b: Vector2, c: Vector2): boolean {
  return Math.abs((a.y-b.y)*(c.x-b.x) - (a.y-b.y)*(b.x-a.x)) < Epsilon;
}

export function findCollinear(referenceIndex: number, source: LineSegment[], startSearchIndex: number): number[] {

  const ref = source[referenceIndex];

  const found = [];

  const [refA, refB] = ref;

  for(let i=startSearchIndex; i<source.length; i++ ) {
    if (i === referenceIndex) {
      continue;
    }

    const [testA, testB] = source[i];

    if (refA.equalsWithEpsilon(testA) && refB.equalsWithEpsilon(testB)) {
      found.push(i);
    }

    if (refA.equalsWithEpsilon(testB) && refB.equalsWithEpsilon(testA)) {
      found.push(i);
    }

    if (isCollinear(refA, refB, testA) && isCollinear(refB, testA, testB)) {
      found.push(i);
    }

  }

  return found;

}
