import {
  ArcRotateCamera,
  Color3,
  IndicesArray, Matrix,
  Mesh,
  MeshBuilder,
  Scene,
  TransformNode,
  Vector3,
  VertexData,
} from '@babylonjs/core';
import { FloatArray } from '@babylonjs/core/types';
import { LineSegment } from './interfaces';

type LineSegment3D = [Vector3, Vector3];

export interface EdgeCandidate {
  edge: LineSegment3D;
  adjacentTriangleANormal: Vector3;
  adjacentTriangleBNormal: Vector3;
}

export function getSilhouetteCandidates(
  indices: IndicesArray,
  vertices: FloatArray,
): EdgeCandidate[] {

  const normalsData = new Float32Array(vertices.length);

  VertexData.ComputeNormals(vertices, indices, normalsData, {useRightHandedSystem: true});

  const normals = [];
  for(let i=0; i<normalsData.length/3; i++) {
    normals[i] = new Vector3(normalsData[i * 3], normalsData[i * 3 + 1], normalsData[i * 3 + 2]);
  }

  const positions = [];
  for(let i=0; i<vertices.length/3; i++) {
    positions[i] = new Vector3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]);
  }

  const adjacency = computeAdjacency(indices, vertices);

  interface Facet {
    normal: Vector3;
    points: Vector3[];
  }

  const facets: Facet[] = [];

  for(let i=0; i<indices.length;i+=3) {
    facets.push({
      normal: normals[indices[i]],
      points: [
        positions[indices[i]],
        positions[indices[i+1]],
        positions[indices[i+2]],
      ]
    })
  }

  const edgeCandidates: EdgeCandidate[] = [];

  for(let i=0; i<adjacency.length; i++) {

    const currentTriangleIndex = (i - i % 3) / 3;
    const adjacentTriangleIndex = adjacency[i];

    const currentFacet = facets[currentTriangleIndex];
    const adjacentFacet = facets[adjacentTriangleIndex];

    if (!adjacentFacet) {
      continue;
    }

    const matchingPoints = currentFacet.points.filter(cfp => adjacentFacet.points.some(afp => afp.equalsWithEpsilon(cfp)));

    if (matchingPoints.length !== 2) {
      continue;
    }

    edgeCandidates.push({
      edge: matchingPoints as LineSegment3D,
      adjacentTriangleANormal: facets[adjacentTriangleIndex].normal,
      adjacentTriangleBNormal: facets[currentTriangleIndex].normal,
    })
  }

  return edgeCandidates;
}

export function findSilhouetteLines(
  edgeCandidates: EdgeCandidate[],
  meshWorldMatrix: Matrix,
  cameraForwardVector: Vector3,
): LineSegment3D[] {

  return edgeCandidates.filter(edgeCandidate => {

    const normalAWorld = Vector3.TransformNormal(edgeCandidate.adjacentTriangleANormal, meshWorldMatrix);
    const normalBWorld = Vector3.TransformNormal(edgeCandidate.adjacentTriangleBNormal, meshWorldMatrix);

    const aFacing = Vector3.Dot(cameraForwardVector, normalAWorld) > 0;
    const bFacing = Vector3.Dot(cameraForwardVector, normalBWorld) > 0;

    return aFacing !== bFacing;

  }).map(candidate => candidate.edge);
}

function computeAdjacency(indices, vertices, epsilon = 0.001): Int32Array {

  const data = new Int32Array(indices.length);

  for (let i = 0; i < indices.length; i++) {

    data[i] = -1;

    for (let j = 0; j < indices.length; j++) {

      if (i !== j && indices[i] === indices[j]) {

        const iNext = i % 3 === 2 ? i - 2 : i + 1;
        const jPrev = j % 3 === 0 ? j + 2 : j - 1;

        if (indices[iNext] === indices[jPrev]) {
          data[i] = (j - j % 3) / 3;
          break;
        }
      }

    }

    // adjacency lookup by index comparison failed, let's try comparing vertex positions
    if (data[i] < 0) {

      for (let j = 0; j < indices.length; j++) {

        if (i !== j && indicesEqualsWithEpsilon(indices, vertices, i, j, epsilon)) {

          const iNext = i % 3 === 2 ? i - 2 : i + 1;
          const jPrev = j % 3 === 0 ? j + 2 : j - 1;

          if (indicesEqualsWithEpsilon(indices, vertices, iNext, jPrev, epsilon)) {
            data[i] = (j - j % 3) / 3;
            break;
          }

        }

      }

    }

  }

  return data;
}

function indicesEqualsWithEpsilon(indices, vertices, indexA, indexB, epsilon = 0.001): boolean {

  for (let k = 0; k < 3; k++) {

    const diff = vertices[indices[indexA] * 3 + k] - vertices[indices[indexB] * 3 + k];

    if (Math.abs(diff) > epsilon) {
      return false;
    }

  }
  return true;
}


