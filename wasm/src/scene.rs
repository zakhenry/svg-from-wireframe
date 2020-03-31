use na::{Matrix4, Point2, Point3, Vector3};

pub struct Scene {
    pub width: i32,
    pub height: i32,
    pub transformation_matrix: Matrix4<f32>,
    pub view_matrix: Matrix4<f32>,
    pub projection_matrix: Matrix4<f32>,
    pub mesh_world_matrix: Matrix4<f32>,
    pub camera_forward_vector: Vector3<f32>,
}

impl Scene {
    pub fn new(
        width: i32,
        height: i32,
        transform: Box<[f32]>,
        view: Box<[f32]>,
        projection: Box<[f32]>,
        mesh_world: Box<[f32]>,
        camera: Box<[f32]>,
    ) -> Scene {
        Scene {
            width,
            height,
            transformation_matrix: Scene::matrix_from_boxed_float_array(transform),
            view_matrix: Scene::matrix_from_boxed_float_array(view),
            projection_matrix: Scene::matrix_from_boxed_float_array(projection),
            mesh_world_matrix: Scene::matrix_from_boxed_float_array(mesh_world),
            camera_forward_vector: Vector3::new(camera[0], camera[1], camera[2]),
        }
    }

    fn matrix_from_boxed_float_array(data: Box<[f32]>) -> Matrix4<f32> {
        Matrix4::new(
            data[0], data[4], data[8], data[12],
            data[1], data[5], data[9], data[13],
            data[2], data[6], data[10], data[14],
            data[3], data[7], data[11], data[15],
        )
    }

    pub fn project_point(&self, point: Point3<f32>) -> Point2<f32> {

        let viewport_mat = Matrix4::new(
            0.5, 0.0, 0.0, 0.5,
            0.0, -0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0,
        );

        let mat = viewport_mat * &self.transformation_matrix * &self.mesh_world_matrix;

        // log!("matrix is {matrix}", matrix=mat);

        let transformed = mat.transform_point(&point);

        // log!("transformed is {transformed}", transformed=transformed);

        Point2::new(
            transformed[0] * self.width as f32,
            transformed[1] * self.height as f32,
        )
    }
}
