extern crate nalgebra as na;

use crate::scene::{Ray, Scene};
use na::{Point2, Point3, Vector3};
use nalgebra::{distance, distance_squared};
use wasm_bindgen::__rt::core::cmp::Ordering;

#[derive(Copy, Clone)]
pub enum LineVisibility {
    VISIBLE = 0,
    OBSCURED = 1,
}

#[derive(Copy, Clone)]
pub struct LineSegment2 {
    pub from: Point2<f32>,
    pub to: Point2<f32>,
}

#[derive(Copy, Clone)]
pub struct LineSegmentCulled {
    pub line_segment: LineSegment2,
    pub visibility: LineVisibility,
}

#[derive(Copy, Clone)]
pub struct LineSegment3 {
    pub from: Point3<f32>,
    pub to: Point3<f32>,
}

pub struct EdgeCandidate {
    pub edge: LineSegment3,
    pub adjacent_triangle_a_normal: Vector3<f32>,
    pub adjacent_triangle_b_normal: Vector3<f32>,
}

#[derive(Copy, Clone)]
pub struct ProjectedLine {
    pub screen_space: LineSegment2,
    pub view_space: LineSegment3,
}

pub struct ProjectedSplitLine {
    pub projected_line: ProjectedLine,
    pub split_screen_space_lines: Vec<LineSegment2>,
}

pub fn find_intersection(a: &LineSegment2, b: &LineSegment2) -> Option<Point2<f32>> {
    if relative_eq!(a.from, b.from)
        || relative_eq!(a.from, b.to)
        || relative_eq!(a.to, b.from)
        || relative_eq!(a.to, b.to)
    {
        return None;
    }

    let p0 = &a.from;
    let p1 = &a.to;
    let p2 = &b.from;
    let p3 = &b.to;

    let p0x = p0.x;
    let p0y = p0.y;
    let p1x = p1.x;
    let p1y = p1.y;
    let p2x = p2.x;
    let p2y = p2.y;
    let p3x = p3.x;
    let p3y = p3.y;

    let s1x = p1x - p0x;
    let s1y = p1y - p0y;
    let s2x = p3x - p2x;
    let s2y = p3y - p2y;

    let s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / (-s2x * s1y + s1x * s2y);
    let t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / (-s2x * s1y + s1x * s2y);

    if s >= 0.0 && s <= 1.0 && t >= 0.0 && t <= 1.0 {
        // intersection detected
        return Some(Point2::new(p0x + t * s1x, p0y + t * s1y));
    }

    None
}

/// @todo work out how to make this not take Copy of line segments
pub fn dedupe_lines(lines: Vec<ProjectedLine>) -> Vec<ProjectedLine> {
    let deduped: Vec<ProjectedLine> = lines
        .iter()
        .enumerate()
        .filter_map(|(index, line)| {
            for i in (index + 1)..lines.len() {
                let compare = &lines[i];

                if relative_eq!(line.screen_space.to, compare.screen_space.to)
                    && relative_eq!(line.screen_space.from, compare.screen_space.from)
                {
                    return None;
                }

                if relative_eq!(line.screen_space.to, compare.screen_space.from)
                    && relative_eq!(line.screen_space.from, compare.screen_space.to)
                {
                    return None;
                }
            }

            Some(line.to_owned())
        })
        .collect();

    deduped
}

#[derive(Copy, Clone)]
enum IntersectionVisited {
    Untested,
    NoIntersection,
    FoundIntersection(Point2<f32>),
}

// @todo there is an annoying amount of cloning going on in here
pub fn split_lines_by_intersection(lines: Vec<ProjectedLine>) -> Vec<ProjectedSplitLine> {
    let line_count = lines.len();

    // @todo this cache size can be halved in size
    let mut found_intersections: Vec<IntersectionVisited> =
        vec![IntersectionVisited::Untested; line_count * line_count];

    lines
        .iter()
        .enumerate()
        .map(|(i, projected_line)| {
            let line = projected_line.screen_space;

            let mut split_points = Vec::with_capacity(10);

            for (j, line_compare) in lines.iter().enumerate() {
                if i == j {
                    continue;
                }

                let intersection = match &found_intersections[i * line_count + j] {
                    IntersectionVisited::Untested => {
                        let test_intersection =
                            find_intersection(&line, &line_compare.screen_space);

                        if j >= i {
                            // don't write to cache for tests already made
                            found_intersections[j * line_count + i] = match &test_intersection {
                                None => IntersectionVisited::NoIntersection,
                                Some(p) => IntersectionVisited::FoundIntersection(p.clone()),
                            };
                        }

                        test_intersection
                    }
                    IntersectionVisited::NoIntersection => None,
                    IntersectionVisited::FoundIntersection(p) => Some(p.clone()),
                };

                if let Some(found) = intersection {
                    split_points.push(found);
                }
            }

            let split_screen_space_lines = match split_points.len() {
                0 => vec![projected_line.screen_space.clone()],
                1 => vec![
                    LineSegment2 {
                        from: projected_line.screen_space.from.clone(),
                        to: split_points[0].clone(),
                    },
                    LineSegment2 {
                        from: split_points[0].clone(),
                        to: projected_line.screen_space.to.clone(),
                    },
                ],
                _ => {
                    split_points.sort_unstable_by(|a, b| {
                        match distance_squared(a, &line.from) < distance_squared(b, &line.from) {
                            true => Ordering::Less,
                            false => Ordering::Greater,
                        }
                    });

                    let mut split_lines = split_points
                        .iter()
                        .enumerate()
                        .map(|(i, point)| {
                            let (from, to) = match i {
                                0 => (line.from.clone(), point.clone()),
                                _ => (split_points[i - 1].clone(), point.clone()),
                            };

                            LineSegment2 { from, to }
                        })
                        .collect::<Vec<LineSegment2>>();

                    split_lines.push(LineSegment2 {
                        from: split_lines.last().unwrap().to.clone(),
                        to: line.to.clone(),
                    });

                    split_lines
                }
            };

            ProjectedSplitLine {
                projected_line: projected_line.clone(),
                split_screen_space_lines,
            }
        })
        .collect::<Vec<ProjectedSplitLine>>()
}

pub fn get_visibility(
    line_segment: &LineSegment2,
    projected_line: &ProjectedLine,
    scene: &Scene,
    ray: &mut Ray,
) -> LineVisibility {
    let screen_space_length = distance(
        &projected_line.screen_space.from,
        &projected_line.screen_space.to,
    );
    let start_distance = distance(&projected_line.screen_space.from, &line_segment.from);
    let end_distance = distance(&projected_line.screen_space.from, &line_segment.to);

    let start_scale = start_distance / screen_space_length;
    let end_scale = end_distance / screen_space_length;

    let scale = start_scale + (end_scale - start_scale) / 2.0;

    let test_screen_space = projected_line
        .screen_space
        .from
        .coords
        .lerp(&projected_line.screen_space.to.coords, scale);

    let test_view_space = projected_line
        .view_space
        .from
        .coords
        .lerp(&projected_line.view_space.to.coords, scale);

    // @todo should be a better way to do this?
    let test_screen_space_point = Point2::new(test_screen_space.x, test_screen_space.y);

    let ray_target = test_view_space;
    let ray_origin = scene.unproject_point(&test_screen_space_point);
    let ray_direction = (&ray_target - &ray_origin.coords).normalize();
    let ray_length = (&ray_origin.coords - &ray_target).norm();

    ray.origin = Point3::new(ray_origin.x, ray_origin.y, ray_origin.z);
    ray.direction = ray_direction;
    ray.length = ray_length;

    match ray.intersects_mesh() {
        false => LineVisibility::VISIBLE,
        true => LineVisibility::OBSCURED,
    }
}
