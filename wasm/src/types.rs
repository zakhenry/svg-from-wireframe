extern crate nalgebra as na;
use na::Point2;

#[derive(Copy, Clone)]
pub enum LineVisibility {
    VISIBLE = 0,
    OBSCURED = 1,
}

pub struct LineSegment {
    pub visibility: LineVisibility,
    pub from: Point2<f32>,
    pub to: Point2<f32>,
}
