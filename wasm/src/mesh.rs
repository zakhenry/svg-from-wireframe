extern crate nalgebra as na;
use crate::types::{EdgeCandidate, LineSegment2, LineSegment3};
use na::{Point3, Vector3};
use crate::scene::Scene;

pub struct Mesh {
    pub indices: Vec<usize>,
    pub vertices: Vec<f32>,
    pub points: Vec<Point3<f32>>,
    pub normals: Option<Vec<Vector3<f32>>>,
}

struct Facet {
    pub normal: Vector3<f32>,
    pub points: Vec<Point3<f32>>,
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

                for i in (0..normals_data.len()).step_by(3) {
                    normals.push(Vector3::new(
                        normals_data[i],
                        normals_data[i+1],
                        normals_data[i+2],
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
                    // indices_equals_with_epsilon(&self.vertices, a, b, epsilon)

                    relative_eq!(&self.points[a], &self.points[b])

                }),
            };

        }

        // for matched in &data {
        //     match matched {
        //         Some(x) => log!("found match {m}", m=x),
        //         None => log!("no match :("),
        //     }
        // }

        data
    }

    pub fn get_facets(&self) -> Vec<Facet> {
        let mut facets: Vec<Facet> = vec![];

        let normals = self.normals.as_ref().unwrap();

        log!("normals {normals}", normals=normals.len());

        for i in (0..self.indices.len() / 3) {
            // log!(
            //     "i is {i}, indices len is {len}, normals len is {normals}",
            //     i = i,
            //     len = self.indices.len(),
            //     normals = normals.len()
            // );

            let point_a = self.indices[i*3];
            let point_b = self.indices[i*3 + 1];
            let point_c = self.indices[i*3 + 2];

            //
            // if point_a > normals.len() || point_b > normals.len() || point_c > normals.len() {
            //     log!("a,b,c: {a},{b},{c}", a=point_a, b=point_b, c=point_c);
            //     panic!("here");
            // }

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

        // panic!("completed");

        facets
    }

    pub fn get_silhouette_candidates(&self) -> Vec<EdgeCandidate> {
        let adjacency = &self.compute_adjacency();
        let mut edge_candidates: Vec<EdgeCandidate> = vec![];

        // log!("adjacency count: {count}", count=adjacency.len());
        // log!("adjacency 0: {adjacency}", adjacency=adjacency[0].expect("adjacency[0] should be some!"));
        // log!("adjacency 10: {adjacency}", adjacency=adjacency[10].unwrap());
        // log!("adjacency 50: {adjacency}", adjacency=adjacency[50].unwrap());
        // log!("adjacency 100: {adjacency}", adjacency=adjacency[100].unwrap());


        let facets = &self.get_facets();

        log!("facet 0, point 0: {p}", p=facets[0].points[0]);
        log!("facet 0, point 1: {p}", p=facets[0].points[1]);
        log!("facet 0, point 2: {p}", p=facets[0].points[2]);

        log!("facet 1, point 0: {p}", p=facets[1].points[0]);
        log!("facet 1, point 1: {p}", p=facets[1].points[1]);
        log!("facet 1, point 2: {p}", p=facets[1].points[2]);
        // log!("facet 100, point 1: {p}", p=facets[100].points[1]);

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

        log!("edge_candidates count {edge_candidates}", edge_candidates=edge_candidates.len());

        edge_candidates
    }

    pub fn transform_normal(self, normal: Vector3<f32>, scene: Scene) -> Vector3<f32> {
        scene.mesh_world_matrix.transform_vector(&normal)
    }

    pub fn find_edge_lines(&self, scene: &Scene, silhouettes_only: bool) -> Vec<LineSegment3> {
        self.get_silhouette_candidates()
            .into_iter()
            .filter(|candidate| {

                if !silhouettes_only {
                    let normal_dot_product = candidate
                        .adjacent_triangle_a_normal
                        .dot(&candidate.adjacent_triangle_b_normal);

                    // log!("dot prod {dp}", dp=normal_dot_product);

                    // angle between faces is greater than arbitrarily chosen value, the edge should be rendered as it is a "sharp" corner
                    if normal_dot_product < 0.8 {
                        return true;
                    }
                }

                let normal_a_world = scene.mesh_world_matrix.transform_vector(&candidate.adjacent_triangle_a_normal);
                let normal_b_world = scene.mesh_world_matrix.transform_vector(&candidate.adjacent_triangle_b_normal);

                let a_facing = scene.camera_forward_vector.dot(&normal_a_world) > 0.0;
                let b_facing = scene.camera_forward_vector.dot(&normal_b_world) > 0.0;

                a_facing != b_facing
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

            if equality_tester(indices[i_next],indices[j_prev]) {
                matched_index = ((j - (j % 3)) / 3) as i32;
                break;
            }
        }
    }

    // log!("matched {matched_index}", matched_index=matched_index);

    match matched_index {
        -1 => None,
        _ => Some(matched_index as usize),
    }
}

fn indices_equals_with_epsilon(
    vertices: &Vec<f32>,
    index_a: usize,
    index_b: usize,
    epsilon: f32,
) -> bool {
    let mut result = true;

    for k in 0..3 {
        let diff = vertices[index_a * 3 + k] - vertices[index_b * 3 + k];

        if (diff.abs() > epsilon) {
            result = false;
            break;
        }
    }
    result
}
