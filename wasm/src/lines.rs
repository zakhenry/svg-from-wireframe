extern crate nalgebra as na;

use na::{Point2, Point3, Vector3};
use nalgebra::{distance_squared, Point};
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
    log!("Line count before deduping: {count}", count = lines.len());

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

    log!("Line count after deduping: {count}", count = deduped.len());

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
    let mut found_intersections: Vec<IntersectionVisited> =
        vec![IntersectionVisited::Untested; lines.len()];

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

                let intersection = match &found_intersections[i] {
                    IntersectionVisited::Untested => {
                        let test_intersection =
                            find_intersection(&line, &line_compare.screen_space);


                        found_intersections[j] = match test_intersection {
                            None => IntersectionVisited::NoIntersection,
                            Some(p) => IntersectionVisited::FoundIntersection(p),
                        };

                        test_intersection.clone()
                    }
                    IntersectionVisited::NoIntersection => None,
                    IntersectionVisited::FoundIntersection(p) => Some(p.clone()),
                };

                if let Some(found) = intersection {
                    log!("intersection found: {}", found);
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
                n => {

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

                    split_lines.push(LineSegment2 { from: split_lines.last().unwrap().to.clone(), to: line.to.clone() });

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
