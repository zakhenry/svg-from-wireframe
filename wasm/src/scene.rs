use na::{Matrix4, Point2, Point3, Vector3, inverse};
use crate::lines::{LineSegment2, LineSegment3, ProjectedLine, dedupe_lines};

pub struct Scene {
    pub width: i32,
    pub height: i32,
    pub view_matrix: Matrix4<f32>,
    pub projection_matrix: Matrix4<f32>,
    pub mesh_world_matrix: Matrix4<f32>,
    pub camera_forward_vector: Vector3<f32>,
}

impl Scene {
    pub fn new(
        width: i32,
        height: i32,
        view: Box<[f32]>,
        projection: Box<[f32]>,
        mesh_world: Box<[f32]>,
        camera: Box<[f32]>,
    ) -> Scene {
        Scene {
            width,
            height,
            view_matrix: Scene::matrix_from_boxed_float_array(view),
            projection_matrix: Scene::matrix_from_boxed_float_array(projection),
            mesh_world_matrix: Scene::matrix_from_boxed_float_array(mesh_world),
            camera_forward_vector: Vector3::new(camera[0], camera[1], camera[2]),
        }
    }

    fn matrix_from_boxed_float_array(data: Box<[f32]>) -> Matrix4<f32> {
        Matrix4::new(
            data[0], data[4], data[8], data[12], data[1], data[5], data[9], data[13], data[2],
            data[6], data[10], data[14], data[3], data[7], data[11], data[15],
        )
    }

    fn get_projection_matrix(&self) -> Matrix4<f32> {

        let viewport_mat = Matrix4::new(
            0.5, 0.0, 0.0, 0.5, 0.0, -0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0,
        );

        let mat = viewport_mat * &self.projection_matrix * &self.view_matrix * &self.mesh_world_matrix;

        mat
    }

    pub fn project_point(&self, point: Point3<f32>) -> Point2<f32> {

        let mat = self.get_projection_matrix();
        // log!("matrix is {matrix}", matrix=mat);

        let transformed = mat.transform_point(&point);

        // log!("transformed is {transformed}", transformed=transformed);

        Point2::new(
            transformed[0] * self.width as f32,
            transformed[1] * self.height as f32,
        )
    }

    pub fn unproject_point(&self, point: Point2<f32>) -> Point3<f32> {

        let mat = self.get_projection_matrix();
        let projection_point = Point3::new(point[0], point[1], 0.0);

        mat.try_inverse().unwrap().transform_point(&projection_point)
    }

    pub fn project_line(&self, line: &LineSegment3) -> LineSegment2 {
        LineSegment2 {
            from: self.project_point(line.to),
            to: self.project_point(line.from)
        }
    }

    pub fn project_lines(&self, lines: &[LineSegment3]) -> Vec<ProjectedLine> {
        // let mut projected_lines = Vec::with_capacity(lines.len());

        let projected_lines: Vec<ProjectedLine> = lines.into_iter().map(|line| {

            let screen_space = self.project_line(line);

            ProjectedLine {
                screen_space,
                view_space: *line
            }

        }).collect();

        dedupe_lines(projected_lines)
    }

}

