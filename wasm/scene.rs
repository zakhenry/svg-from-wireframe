use crate::lines::{dedupe_lines, LineSegment2, LineSegment3, ProjectedLine};
use crate::mesh::{Facet, Mesh};
use na::{Matrix4, Point2, Point3, Vector3};

pub struct Scene {
    pub width: f32,
    pub height: f32,
    pub view_matrix: Matrix4<f32>,
    pub projection_matrix: Matrix4<f32>,
    pub mesh_world_matrix: Matrix4<f32>,
    pub camera_forward_vector: Vector3<f32>,
    transformation_matrix: Matrix4<f32>,
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
        let view_matrix = Scene::matrix_from_boxed_float_array(view);
        let projection_matrix = Scene::matrix_from_boxed_float_array(projection);
        let mesh_world_matrix = Scene::matrix_from_boxed_float_array(mesh_world);
        let transformation_matrix = &projection_matrix * &view_matrix * &mesh_world_matrix;

        Scene {
            width: width as f32,
            height: height as f32,
            view_matrix,
            projection_matrix,
            mesh_world_matrix,
            camera_forward_vector: Vector3::new(camera[0], camera[1], camera[2]),
            transformation_matrix,
        }
    }

    fn matrix_from_boxed_float_array(data: Box<[f32]>) -> Matrix4<f32> {
        Matrix4::new(
            data[0], data[4], data[8], data[12], data[1], data[5], data[9], data[13], data[2],
            data[6], data[10], data[14], data[3], data[7], data[11], data[15],
        )
    }

    pub fn project_point(&self, point: &Point3<f32>) -> Point2<f32> {
        let transformed = &self.transformation_matrix.transform_point(&point);

        Point2::new(
            (transformed.x + 1.0) / 2.0 * self.width,
            (transformed.y - 1.0) / 2.0 * -self.height,
        )
    }

    pub fn unproject_point(&self, point: &Point2<f32>) -> Point3<f32> {
        let inverted = &self.transformation_matrix.try_inverse().unwrap();

        let projection_point = Point3::new(
            (point.x / self.width) * 2.0 - 1.0,
            -((point.y / self.height) * 2.0 - 1.0),
            -1.0,
        );

        inverted.transform_point(&projection_point)
    }

    pub fn project_line(&self, line: &LineSegment3) -> LineSegment2 {
        LineSegment2 {
            from: self.project_point(&line.from),
            to: self.project_point(&line.to),
        }
    }

    pub fn project_lines(&self, lines: &[LineSegment3]) -> Vec<ProjectedLine> {
        let projected_lines: Vec<ProjectedLine> = lines
            .into_iter()
            .map(|line| {
                let screen_space = self.project_line(line);

                ProjectedLine {
                    screen_space,
                    view_space: line.to_owned(),
                }
            })
            .collect();

        dedupe_lines(projected_lines)
    }
}

pub struct Ray<'a> {
    pub origin: Point3<f32>,
    pub direction: Vector3<f32>,
    pub length: f32,
    mesh: &'a Mesh,
}

impl<'a> Ray<'a> {
    pub fn new(mesh: &'a Mesh) -> Ray<'a> {
        Ray {
            origin: Point3::origin(),
            direction: Vector3::zeros(),
            length: 0.0,
            mesh,
        }
    }

    pub fn intersects_mesh(&self) -> bool {
        for facet in &self.mesh.facets {
            if let Some(distance) = self.intersects_facet(facet) {
                if (&self.length - distance) > 0.01 {
                    return true;
                }
            }
        }

        false
    }

    fn intersects_facet(&self, facet: &Facet) -> Option<f32> {
        let edge_1 = &facet.points[1] - &facet.points[0];
        let edge_2 = &facet.points[2] - &facet.points[0];

        let pvec: Vector3<f32> = self.direction.cross(&edge_2);

        let det = edge_1.dot(&pvec);

        if det == 0.0 {
            return None;
        }

        let invdet = 1.0 / det;

        let tvec = &self.origin - &facet.points[0];

        let bv = tvec.dot(&pvec) * invdet;

        if bv < 0.0 || bv > 1.0 {
            return None;
        }

        let qvec = tvec.cross(&edge_1);

        let bw = &self.direction.dot(&qvec) * invdet;

        if bw < 0.0 || bv + bw > 1.0 {
            return None;
        }

        let distance = edge_2.dot(&qvec) * invdet;

        if distance > self.length {
            return None;
        }

        Some(distance)
    }
}
