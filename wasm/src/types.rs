extern crate nalgebra as na;
use na::{Point2, Point3, Vector3};

#[derive(Copy, Clone)]
pub enum LineVisibility {
    VISIBLE = 0,
    OBSCURED = 1,
}

pub struct LineSegment2 {
    pub visibility: LineVisibility,
    pub from: Point2<f32>,
    pub to: Point2<f32>,
}

pub struct LineSegment3 {
    pub from: Point3<f32>,
    pub to: Point3<f32>,
}

pub struct EdgeCandidate {
    pub edge: LineSegment3,
    pub adjacent_triangle_a_normal: Vector3<f32>,
    pub adjacent_triangle_b_normal: Vector3<f32>,
}
