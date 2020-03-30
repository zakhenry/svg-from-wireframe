extern crate nalgebra as na;
use na::{Point3, Vector3};

pub struct Mesh {
    pub indices: Vec<i32>,
    pub vertices: Vec<Point3<f32>>,
    pub normals: Option<Vec<Vector3<f32>>>,
}

impl Mesh {
    pub fn new(
        indices_data: Box<[i32]>,
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

    pub fn new_wireframe(indices_data: Box<[i32]>, vertices_data: Box<[f32]>) -> Mesh {
        let mut vertices = Vec::new();

        for i in (0..vertices_data.len()/3) {
            vertices.push(Point3::new(
                vertices_data[i*3],
                vertices_data[i*3 + 1],
                vertices_data[i*3 + 2],
            ))
        }

        Mesh {
            indices: indices_data.into_vec(),
            vertices,
            normals: Option::None,
        }
    }
}
