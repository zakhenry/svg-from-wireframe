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

export interface Facet {
  normalWorld: Vector3;
}

export interface EdgeCandidate {
  edge: LineSegment;
  facetA: Facet;
  facetB: Facet;
}

export function getSilhouetteCandidates(
  indices: IndicesArray,
  vertices: FloatArray,
  mesh: Mesh,
  scene: Scene,
): EdgeCandidate[] {
  return [];
}

export function findSilhouetteLines(
  indices: IndicesArray,
  vertices: FloatArray,
  mesh: Mesh,
  scene: Scene,
): LineSegment[] {

  // mesh.material.wireframe = true;

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

  const visibleNormals = [];
  const hiddenNormals = [];

  const cameraNormal = (scene.activeCamera as ArcRotateCamera).getFrontPosition(1);
  mesh.computeWorldMatrix();
  const transform = mesh.getWorldMatrix();

  positions.forEach((positionLocal, i) => {

    const positionWorld = Vector3.TransformCoordinates(positionLocal, transform);
    const normalWorld = Vector3.TransformNormal(normals[i], transform);

    if (Vector3.Dot(cameraNormal, normalWorld) > 0) {
      visibleNormals.push([positionWorld, positionWorld.add(normalWorld)]);
    } else {
      hiddenNormals.push([positionWorld, positionWorld.add(normalWorld)]);
    }

  });

  const lineSystem = MeshBuilder.CreateLineSystem("ls", {lines: visibleNormals}, scene);
  lineSystem.color = Color3.Green();
  const lineSystemHidden = MeshBuilder.CreateLineSystem("ls", {lines: hiddenNormals}, scene);
  lineSystemHidden.color = Color3.Red();

  // const dbg = MeshBuilder.CreateBox('dbg', {size: 1}, scene);
  // dbg.position = lines[0][0];

  // lineSystem.parent = mesh;
  // lineSystemHidden.parent = mesh;

  return null;
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


