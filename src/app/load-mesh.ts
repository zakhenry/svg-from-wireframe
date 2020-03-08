import { LinesMesh, Mesh, Scene, VertexData } from '@babylonjs/core';

type FloatArray = number[] | Float32Array;
type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;


enum GeometryType {
  UNKNOWN = 0,
  POINTS = 1,
  LINES = 2,
  LINE_STRIP = 3,
  TRIANGLES = 4,
  TRIANGLE_STRIP = 5,
  TRIANGLE_FAN = 6
}

export interface MeshPairData {
  id: string;
  mesh: MeshAssetData;
  edgesMesh: MeshAssetData;
}


export interface MeshPair {
  id: string;
  mesh: Mesh;
  edgesMesh: LinesMesh;
}

export interface MeshAssetData {
  positions: FloatArray | null;
  normals: FloatArray | null;
  indices: IndicesArray | null;
  geomType: GeometryType;
}

function generateLineIndices(positions: ArrayLike<number>): Int32Array {
  const positionsLength = positions.length / 3;
  const indices = new Int32Array(positionsLength);

  for (let i = 0; i < positionsLength; i++) {
    indices[i] = i;
  }
  return indices;
}

function generateLineStripIndices(positions: ArrayLike<number>): Int32Array {
  const positionsLength = positions.length / 3;
  const indices = new Int32Array(Math.max(positionsLength * 2 - 2, 0));

  for (let i = positionsLength + 1; i > 0; i--) {
    indices[i * 2 - 1] = i;
    indices[i * 2] = i;
  }
  return indices;
}

export function createMesh(name: string, scene: Scene, meshData: MeshAssetData): Mesh {
  const { positions, normals, indices, geomType } = meshData;

  const vertexData = new VertexData();
  vertexData.positions = Float32Array.from(positions);

  let mesh: Mesh;

  switch (geomType) {
    case GeometryType.TRIANGLES: {
      vertexData.indices = Int32Array.from(indices);
      vertexData.normals = Float32Array.from(normals);

      mesh = new Mesh(name, scene);
      break;
    }
    case GeometryType.LINES: {
      vertexData.indices = generateLineIndices(positions);
      mesh = new LinesMesh(name, scene);
      break;
    }
    case GeometryType.LINE_STRIP: {
      vertexData.indices = generateLineStripIndices(positions);
      mesh = new LinesMesh(name, scene);
      break;
    }
    case GeometryType.POINTS: {
      mesh = new Mesh(name, scene);
      break;
    }
    case GeometryType.UNKNOWN:
    default: {
      throw new Error('when loading meshes');
    }
  }

  vertexData.applyToMesh(mesh);
  mesh._unIndexed = !indices || indices.length === 0;

  return mesh;
}

export function createMeshPair(scene: Scene, meshPair: MeshPairData): MeshPair {

  const id = meshPair.id;

  return {
    id,
    mesh: createMesh(id + 'mesh', scene, meshPair.mesh),
    edgesMesh: createMesh(id + 'edges', scene, meshPair.edgesMesh) as LinesMesh,
  }

}
