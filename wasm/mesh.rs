extern crate nalgebra as na;

use na::{Point3, Vector3};

use crate::lines::{EdgeCandidate, LineSegment3};
use crate::scene::Scene;

pub struct Mesh {
    pub indices: Vec<usize>,
    pub vertices: Vec<f32>,
    pub points: Vec<Point3<f32>>,
    pub normals: Vec<Vector3<f32>>,
    pub facets: Vec<Facet>,
}

pub struct Wireframe {
    pub indices: Vec<usize>,
    pub vertices: Vec<f32>,
    pub points: Vec<Point3<f32>>,
}

pub struct Facet {
    pub normal: Vector3<f32>,
    pub points: Vec<Point3<f32>>,
}

impl Wireframe {
    pub fn new(indices_data: Box<[usize]>, vertices_data: Box<[f32]>) -> Wireframe {
        let mut points = Vec::with_capacity(vertices_data.len() / 3);

        for i in 0..vertices_data.len() / 3 {
            points.push(Point3::new(
                vertices_data[i * 3],
                vertices_data[i * 3 + 1],
                vertices_data[i * 3 + 2],
            ))
        }

        Wireframe {
            indices: indices_data.into_vec(),
            vertices: vertices_data.into_vec(),
            points,
        }
    }

    pub fn edges(&self) -> Vec<LineSegment3> {
        let mut segments = Vec::with_capacity(&self.points.len() / 2);

        for (i, vertex) in self.points.iter().enumerate().step_by(2) {
            let from = vertex.to_owned();
            let to = self.points[i + 1].to_owned();

            segments.push(LineSegment3 { from, to })
        }

        segments
    }
}

impl Mesh {
    pub fn new(
        indices_data: Box<[usize]>,
        vertices_data: Box<[f32]>,
        normals_data: Box<[f32]>,
    ) -> Mesh {
        let base_mesh = Wireframe::new(indices_data, vertices_data);
        let mut normals = Vec::with_capacity(normals_data.len() / 3);

        for i in (0..normals_data.len()).step_by(3) {
            normals.push(Vector3::new(
                normals_data[i],
                normals_data[i + 1],
                normals_data[i + 2],
            ))
        }

        let facets = get_facets(&base_mesh.indices, &base_mesh.points, &normals);

        Mesh {
            indices: base_mesh.indices,
            vertices: base_mesh.vertices,
            points: base_mesh.points,
            normals,
            facets,
        }
    }

    pub fn compute_adjacency(&self) -> Vec<Option<usize>> {
        let index_count = self.indices.len();
        let mut data: Vec<Option<usize>> = vec![Option::None; index_count];

        for i in 0..index_count {
            data[i] = match find_match(&self.indices, i, |a, b| a == b) {
                Some(x) => Some(x),
                None => find_match(&self.indices, i, |a, b| {
                    relative_eq!(&self.points[a], &self.points[b])
                }),
            };
        }

        data
    }

    pub fn get_silhouette_candidates(&self) -> Vec<EdgeCandidate> {
        let adjacency = &self.compute_adjacency();
        let mut edge_candidates: Vec<EdgeCandidate> = Vec::with_capacity(adjacency.len());

        let facets = &self.facets;

        for i in 0..adjacency.len() {
            match adjacency[i] {
                None => continue,
                Some(adjacent_triangle_index) => {
                    let current_triangle_index = (i - (i % 3)) / 3;
                    let adjacent_facet = &facets[adjacent_triangle_index];
                    let current_facet = &facets[current_triangle_index];

                    let matching_points: Vec<&Point3<f32>> = current_facet
                        .points
                        .iter()
                        .filter(|cfp| {
                            adjacent_facet
                                .points
                                .iter()
                                .any(|afp| relative_eq!(afp, cfp))
                        })
                        .collect();

                    if matching_points.len() != 2 {
                        continue;
                    }

                    edge_candidates.push(EdgeCandidate {
                        edge: LineSegment3 {
                            from: matching_points[0].clone(),
                            to: matching_points[1].clone(),
                        },
                        adjacent_triangle_a_normal: adjacent_facet.normal.clone(),
                        adjacent_triangle_b_normal: current_facet.normal.clone(),
                    });
                }
            }
        }

        edge_candidates
    }

    pub fn find_edge_lines(&self, scene: &Scene, silhouettes_only: bool) -> Vec<LineSegment3> {
        self.get_silhouette_candidates()
            .into_iter()
            .filter(|candidate| {
                if !silhouettes_only {
                    let normal_dot_product = candidate
                        .adjacent_triangle_a_normal
                        .dot(&candidate.adjacent_triangle_b_normal);

                    // angle between faces is greater than arbitrarily chosen value, the edge should be rendered as it is a "sharp" corner
                    if normal_dot_product < 0.8 {
                        return true;
                    }
                }

                let normal_a_world = scene
                    .mesh_world_matrix
                    .transform_vector(&candidate.adjacent_triangle_a_normal);
                let normal_b_world = scene
                    .mesh_world_matrix
                    .transform_vector(&candidate.adjacent_triangle_b_normal);

                let a_facing = scene.camera_forward_vector.dot(&normal_a_world) > 0.0;
                let b_facing = scene.camera_forward_vector.dot(&normal_b_world) > 0.0;

                a_facing != b_facing
            })
            .map(|candidate| candidate.edge)
            .collect()
    }
}

fn find_match<F>(indices: &[usize], i: usize, equality_tester: F) -> Option<usize>
where
    F: Fn(usize, usize) -> bool,
{
    let mut matched_index = -1;

    for j in 0..indices.len() {
        if i != j && equality_tester(indices[i], indices[j]) {
            let i_next = match i % 3 {
                2 => i - 2,
                _ => i + 1,
            };

            let j_prev = match j % 3 {
                0 => j + 2,
                _ => j - 1,
            };

            if equality_tester(indices[i_next], indices[j_prev]) {
                matched_index = ((j - (j % 3)) / 3) as i32;
                break;
            }
        }
    }

    match matched_index {
        -1 => None,
        _ => Some(matched_index as usize),
    }
}

fn get_facets(indices: &[usize], points: &[Point3<f32>], normals: &[Vector3<f32>]) -> Vec<Facet> {
    let mut facets: Vec<Facet> = Vec::with_capacity(indices.len() / 3);

    for i in 0..indices.len() / 3 {
        let point_a = indices[i * 3];
        let point_b = indices[i * 3 + 1];
        let point_c = indices[i * 3 + 2];

        let average_normal = (&normals[point_a] + &normals[point_b] + &normals[point_c]) / 3.0;

        facets.push(Facet {
            normal: average_normal,
            points: vec![
                points[point_a].clone(),
                points[point_b].clone(),
                points[point_c].clone(),
            ],
        });
    }

    facets
}
