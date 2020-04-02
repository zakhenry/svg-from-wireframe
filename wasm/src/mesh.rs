extern crate nalgebra as na;
use crate::types::{EdgeCandidate, LineSegment2, LineSegment3};
use na::{Point3, Vector3};

pub struct Mesh {
    pub indices: Vec<usize>,
    pub vertices: Vec<f32>,
    pub points: Vec<Point3<f32>>,
    pub normals: Option<Vec<Vector3<f32>>>,
}

struct Facet {
    normal: Vector3<f32>,
    points: Vec<Point3<f32>>,
}

impl Mesh {
    pub fn new(
        indices_data: Box<[usize]>,
        vertices_data: Box<[f32]>,
        maybe_normals_data: Option<Box<[f32]>>,
    ) -> Mesh {
        let mut mesh = Mesh::new_wireframe(indices_data.clone(), vertices_data);
        mesh.normals = match maybe_normals_data {
            Some(normals_data) => {
                let mut normals = Vec::new();

                for i in (0..indices_data.len()).step_by(3) {
                    normals.push(Vector3::new(
                        normals_data[indices_data[i] as usize],
                        normals_data[indices_data[i + 1] as usize],
                        normals_data[indices_data[i + 2] as usize],
                    ))
                }

                Some(normals)
            }
            None => panic!("Mesh must have normals!"),
        };
            log!(
                "Mesh stats: indices: {indices} points: {points} normals: {normals}",
                indices = mesh.indices.clone().len(),
                points = mesh.points.clone().len(),
                normals = mesh.normals.clone().unwrap().len()
            );

        mesh
    }

    pub fn new_wireframe(indices_data: Box<[usize]>, vertices_data: Box<[f32]>) -> Mesh {
        let mut points = Vec::new();

        for i in (0..vertices_data.len() / 3) {
            points.push(Point3::new(
                vertices_data[i * 3],
                vertices_data[i * 3 + 1],
                vertices_data[i * 3 + 2],
            ))
        }

        Mesh {
            indices: indices_data.into_vec(),
            vertices: vertices_data.into_vec(),
            points,
            normals: Option::None,
        }
    }

    pub fn compute_adjacency(&self) -> Vec<Option<usize>> {
        let epsilon: f32 = 0.001;

        let index_count = self.indices.len();
        let mut data: Vec<Option<usize>> = vec![Option::None; index_count];

        for i in (0..index_count) {
            data[i] = match find_match(&self.indices, i, |a, b| a == b) {
                Some(x) => Some(x),
                None => find_match(&self.indices, i, |a, b| {
                    indices_equals_with_epsilon(&self.indices, &self.vertices, a, b, epsilon)
                }),
            }
        }

        data
    }

    pub fn get_facets(&self) -> Vec<Facet> {
        let mut facets: Vec<Facet> = vec![];

        let normals = self.normals.as_ref().unwrap();

        for i in (0..self.indices.len() / 3) {
            // log!(
            //     "i is {i}, indices len is {len}, normals len is {normals}",
            //     i = i,
            //     len = self.indices.len(),
            //     normals = normals.len()
            // );

            let point_a = self.indices[i];
            let point_b = self.indices[i + 1];
            let point_c = self.indices[i + 2];

            let average_normal = (&normals[point_a] + &normals[point_b] + &normals[point_c]) / 3.0;

            facets.push(Facet {
                normal: average_normal,
                points: vec![
                    self.points[point_a].clone(),
                    self.points[point_b].clone(),
                    self.points[point_c].clone(),
                ],
            });
        }

        facets
    }

    pub fn get_silhouette_candidates(&self) -> Vec<EdgeCandidate> {
        let mut edge_candidates: Vec<EdgeCandidate> = vec![];
        let adjacency = &self.compute_adjacency();
        let facets = &self.get_facets();

        for i in (0..adjacency.len()) {
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

    pub fn find_edge_lines(&self, silhouettes_only: bool) -> Vec<LineSegment3> {
        self.get_silhouette_candidates()
            .into_iter()
            .filter(|candidate| {
                if !silhouettes_only {
                    let normal_dot_product = candidate
                        .adjacent_triangle_a_normal
                        .dot(&candidate.adjacent_triangle_a_normal);

                    // angle between faces is greater than arbitrarily chosen value, the edge should be rendered as it is a "sharp" corner
                    if normal_dot_product < 0.95 {
                        return true;
                    }
                }

                // @todo add edge finding

                false
            })
            .map(|candidate| candidate.edge)
            .collect()
    }
}

fn find_match<F>(indices: &Vec<usize>, i: usize, equality_tester: F) -> Option<usize>
where
    F: Fn(usize, usize) -> bool,
{
    let mut matched_index = -1;

    for j in (0..indices.len()) {
        if (i != j && equality_tester(indices[i], indices[j])) {
            let i_next = match i % 3 {
                2 => i - 2,
                _ => i + 1,
            };

            let j_prev = match j % 3 {
                0 => j + 2,
                _ => j - 1,
            };

            if (indices[i_next] == indices[j_prev]) {
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

fn indices_equals_with_epsilon(
    indices: &Vec<usize>,
    vertices: &Vec<f32>,
    index_a: usize,
    index_b: usize,
    epsilon: f32,
) -> bool {
    let mut result = true;

    for k in 0..3 {
        let diff = vertices[indices[index_a] * 3 + k] - vertices[indices[index_b] as usize * 3 + k];

        if (diff.abs() > epsilon) {
            result = false;
            break;
        }
    }
    result
}
