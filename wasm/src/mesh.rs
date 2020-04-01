extern crate nalgebra as na;
use na::{Point3, Vector3};

pub struct Mesh {
    pub indices: Vec<usize>,
    pub vertices: Vec<f32>,
    pub points: Vec<Point3<f32>>,
    pub normals: Option<Vec<Vector3<f32>>>,
}

impl Mesh {
    pub fn new(
        indices_data: Box<[usize]>,
        vertices_data: Box<[f32]>,
        maybe_normals_data: Option<Box<[f32]>>,
    ) -> Mesh {
        let mut mesh = Mesh::new_wireframe(indices_data.clone(), vertices_data);
        match maybe_normals_data {
            Some(normals_data) => {
                let mut normals = Vec::new();

                for i in (0..indices_data.len()).step_by(3) {
                    normals.push(Vector3::new(
                        normals_data[indices_data[i] as usize],
                        normals_data[indices_data[i + 1] as usize],
                        normals_data[indices_data[i + 2] as usize],
                    ))
                }

                mesh.normals = Some(normals);

                mesh
            }
            None => mesh,
        }
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

    pub fn compute_adjacency(&self) -> Vec<i32> {
        let epsilon: f32 = 0.001;

        let index_count = self.indices.len();
        let mut data: Vec<i32> = vec![-1; index_count];

        for i in (0..index_count) {
            data[i] = match find_match(&self.indices, i, |a, b| a == b) {
                Some(x) => x,
                None => match find_match(&self.indices, i, |a, b| indices_equals_with_epsilon(&self.indices, &self.vertices, a, b, epsilon)) {
                    Some(x) => x,
                    None => -1,
                },
            }
        }

        data
    }
}

fn find_match<F>(indices: &Vec<usize>, i: usize, equality_tester: F) -> Option<i32>
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
        _ => Some(matched_index),
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
