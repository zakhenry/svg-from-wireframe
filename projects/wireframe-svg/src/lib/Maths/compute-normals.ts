import { Vector3 } from './math.vector';

export function computeNormals(
  positions: any,
  indices: any,
  normals: any,
  options?: {
    facetNormals?: any;
    facetPositions?: any;
    facetPartitioning?: any;
    ratio?: number;
    bInfo?: any;
    bbSize?: Vector3;
    subDiv?: any;
    useRightHandedSystem?: boolean;
    depthSort?: boolean;
    distanceTo?: Vector3;
    depthSortedFacets?: any;
  },
): void {
  // temporary scalar variables
  var index = 0; // facet index
  var p1p2x = 0.0; // p1p2 vector x coordinate
  var p1p2y = 0.0; // p1p2 vector y coordinate
  var p1p2z = 0.0; // p1p2 vector z coordinate
  var p3p2x = 0.0; // p3p2 vector x coordinate
  var p3p2y = 0.0; // p3p2 vector y coordinate
  var p3p2z = 0.0; // p3p2 vector z coordinate
  var faceNormalx = 0.0; // facet normal x coordinate
  var faceNormaly = 0.0; // facet normal y coordinate
  var faceNormalz = 0.0; // facet normal z coordinate
  var length = 0.0; // facet normal length before normalization
  var v1x = 0; // vector1 x index in the positions array
  var v1y = 0; // vector1 y index in the positions array
  var v1z = 0; // vector1 z index in the positions array
  var v2x = 0; // vector2 x index in the positions array
  var v2y = 0; // vector2 y index in the positions array
  var v2z = 0; // vector2 z index in the positions array
  var v3x = 0; // vector3 x index in the positions array
  var v3y = 0; // vector3 y index in the positions array
  var v3z = 0; // vector3 z index in the positions array
  var computeFacetNormals = false;
  var computeFacetPositions = false;
  var computeFacetPartitioning = false;
  var computeDepthSort = false;
  var faceNormalSign = 1;
  let ratio = 0;
  var distanceTo: Vector3 | null = null;
  if (options) {
    computeFacetNormals = options.facetNormals ? true : false;
    computeFacetPositions = options.facetPositions ? true : false;
    computeFacetPartitioning = options.facetPartitioning ? true : false;
    faceNormalSign = options.useRightHandedSystem === true ? -1 : 1;
    ratio = options.ratio || 0;
    computeDepthSort = options.depthSort ? true : false;
    distanceTo = <Vector3>options.distanceTo;
    if (computeDepthSort) {
      if (distanceTo === undefined) {
        distanceTo = Vector3.Zero();
      }
      var depthSortedFacets = options.depthSortedFacets;
    }
  }

  // facetPartitioning reinit if needed
  let xSubRatio = 0;
  let ySubRatio = 0;
  let zSubRatio = 0;
  let subSq = 0;
  if (computeFacetPartitioning && options && options.bbSize) {
    var ox = 0; // X partitioning index for facet position
    var oy = 0; // Y partinioning index for facet position
    var oz = 0; // Z partinioning index for facet position
    var b1x = 0; // X partitioning index for facet v1 vertex
    var b1y = 0; // Y partitioning index for facet v1 vertex
    var b1z = 0; // z partitioning index for facet v1 vertex
    var b2x = 0; // X partitioning index for facet v2 vertex
    var b2y = 0; // Y partitioning index for facet v2 vertex
    var b2z = 0; // Z partitioning index for facet v2 vertex
    var b3x = 0; // X partitioning index for facet v3 vertex
    var b3y = 0; // Y partitioning index for facet v3 vertex
    var b3z = 0; // Z partitioning index for facet v3 vertex
    var block_idx_o = 0; // facet barycenter block index
    var block_idx_v1 = 0; // v1 vertex block index
    var block_idx_v2 = 0; // v2 vertex block index
    var block_idx_v3 = 0; // v3 vertex block index

    var bbSizeMax = options.bbSize.x > options.bbSize.y ? options.bbSize.x : options.bbSize.y;
    bbSizeMax = bbSizeMax > options.bbSize.z ? bbSizeMax : options.bbSize.z;
    xSubRatio = (options.subDiv.X * ratio) / options.bbSize.x;
    ySubRatio = (options.subDiv.Y * ratio) / options.bbSize.y;
    zSubRatio = (options.subDiv.Z * ratio) / options.bbSize.z;
    subSq = options.subDiv.max * options.subDiv.max;
    options.facetPartitioning.length = 0;
  }

  // reset the normals
  for (index = 0; index < positions.length; index++) {
    normals[index] = 0.0;
  }

  // Loop : 1 indice triplet = 1 facet
  var nbFaces = (indices.length / 3) | 0;
  for (index = 0; index < nbFaces; index++) {
    // get the indexes of the coordinates of each vertex of the facet
    v1x = indices[index * 3] * 3;
    v1y = v1x + 1;
    v1z = v1x + 2;
    v2x = indices[index * 3 + 1] * 3;
    v2y = v2x + 1;
    v2z = v2x + 2;
    v3x = indices[index * 3 + 2] * 3;
    v3y = v3x + 1;
    v3z = v3x + 2;

    p1p2x = positions[v1x] - positions[v2x]; // compute two vectors per facet : p1p2 and p3p2
    p1p2y = positions[v1y] - positions[v2y];
    p1p2z = positions[v1z] - positions[v2z];

    p3p2x = positions[v3x] - positions[v2x];
    p3p2y = positions[v3y] - positions[v2y];
    p3p2z = positions[v3z] - positions[v2z];

    // compute the face normal with the cross product
    faceNormalx = faceNormalSign * (p1p2y * p3p2z - p1p2z * p3p2y);
    faceNormaly = faceNormalSign * (p1p2z * p3p2x - p1p2x * p3p2z);
    faceNormalz = faceNormalSign * (p1p2x * p3p2y - p1p2y * p3p2x);
    // normalize this normal and store it in the array facetData
    length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
    length = length === 0 ? 1.0 : length;
    faceNormalx /= length;
    faceNormaly /= length;
    faceNormalz /= length;

    if (computeFacetNormals && options) {
      options.facetNormals[index].x = faceNormalx;
      options.facetNormals[index].y = faceNormaly;
      options.facetNormals[index].z = faceNormalz;
    }

    if (computeFacetPositions && options) {
      // compute and the facet barycenter coordinates in the array facetPositions
      options.facetPositions[index].x = (positions[v1x] + positions[v2x] + positions[v3x]) / 3.0;
      options.facetPositions[index].y = (positions[v1y] + positions[v2y] + positions[v3y]) / 3.0;
      options.facetPositions[index].z = (positions[v1z] + positions[v2z] + positions[v3z]) / 3.0;
    }

    if (computeFacetPartitioning && options) {
      // store the facet indexes in arrays in the main facetPartitioning array :
      // compute each facet vertex (+ facet barycenter) index in the partiniong array
      ox = Math.floor((options.facetPositions[index].x - options.bInfo.minimum.x * ratio) * xSubRatio);
      oy = Math.floor((options.facetPositions[index].y - options.bInfo.minimum.y * ratio) * ySubRatio);
      oz = Math.floor((options.facetPositions[index].z - options.bInfo.minimum.z * ratio) * zSubRatio);
      b1x = Math.floor((positions[v1x] - options.bInfo.minimum.x * ratio) * xSubRatio);
      b1y = Math.floor((positions[v1y] - options.bInfo.minimum.y * ratio) * ySubRatio);
      b1z = Math.floor((positions[v1z] - options.bInfo.minimum.z * ratio) * zSubRatio);
      b2x = Math.floor((positions[v2x] - options.bInfo.minimum.x * ratio) * xSubRatio);
      b2y = Math.floor((positions[v2y] - options.bInfo.minimum.y * ratio) * ySubRatio);
      b2z = Math.floor((positions[v2z] - options.bInfo.minimum.z * ratio) * zSubRatio);
      b3x = Math.floor((positions[v3x] - options.bInfo.minimum.x * ratio) * xSubRatio);
      b3y = Math.floor((positions[v3y] - options.bInfo.minimum.y * ratio) * ySubRatio);
      b3z = Math.floor((positions[v3z] - options.bInfo.minimum.z * ratio) * zSubRatio);

      block_idx_v1 = b1x + options.subDiv.max * b1y + subSq * b1z;
      block_idx_v2 = b2x + options.subDiv.max * b2y + subSq * b2z;
      block_idx_v3 = b3x + options.subDiv.max * b3y + subSq * b3z;
      block_idx_o = ox + options.subDiv.max * oy + subSq * oz;

      options.facetPartitioning[block_idx_o] = options.facetPartitioning[block_idx_o]
        ? options.facetPartitioning[block_idx_o]
        : new Array();
      options.facetPartitioning[block_idx_v1] = options.facetPartitioning[block_idx_v1]
        ? options.facetPartitioning[block_idx_v1]
        : new Array();
      options.facetPartitioning[block_idx_v2] = options.facetPartitioning[block_idx_v2]
        ? options.facetPartitioning[block_idx_v2]
        : new Array();
      options.facetPartitioning[block_idx_v3] = options.facetPartitioning[block_idx_v3]
        ? options.facetPartitioning[block_idx_v3]
        : new Array();

      // push each facet index in each block containing the vertex
      options.facetPartitioning[block_idx_v1].push(index);
      if (block_idx_v2 != block_idx_v1) {
        options.facetPartitioning[block_idx_v2].push(index);
      }
      if (!(block_idx_v3 == block_idx_v2 || block_idx_v3 == block_idx_v1)) {
        options.facetPartitioning[block_idx_v3].push(index);
      }
      if (!(block_idx_o == block_idx_v1 || block_idx_o == block_idx_v2 || block_idx_o == block_idx_v3)) {
        options.facetPartitioning[block_idx_o].push(index);
      }
    }

    if (computeDepthSort && options && options.facetPositions) {
      var dsf = depthSortedFacets[index];
      dsf.ind = index * 3;
      dsf.sqDistance = Vector3.DistanceSquared(options.facetPositions[index], distanceTo!);
    }

    // compute the normals anyway
    normals[v1x] += faceNormalx; // accumulate all the normals per face
    normals[v1y] += faceNormaly;
    normals[v1z] += faceNormalz;
    normals[v2x] += faceNormalx;
    normals[v2y] += faceNormaly;
    normals[v2z] += faceNormalz;
    normals[v3x] += faceNormalx;
    normals[v3y] += faceNormaly;
    normals[v3z] += faceNormalz;
  }
  // last normalization of each normal
  for (index = 0; index < normals.length / 3; index++) {
    faceNormalx = normals[index * 3];
    faceNormaly = normals[index * 3 + 1];
    faceNormalz = normals[index * 3 + 2];

    length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
    length = length === 0 ? 1.0 : length;
    faceNormalx /= length;
    faceNormaly /= length;
    faceNormalz /= length;

    normals[index * 3] = faceNormalx;
    normals[index * 3 + 1] = faceNormaly;
    normals[index * 3 + 2] = faceNormalz;
  }
}
