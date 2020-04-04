#[macro_use]
mod utils;
mod lines;
mod mesh;
mod scene;
mod svg_renderer;

use mesh::{Mesh, Wireframe};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern crate nalgebra as na;
use na::{Point2, Point3};

use crate::lines::split_lines_by_intersection;
use crate::svg_renderer::{SvgConfig, SvgLineConfig};
use crate::utils::set_panic_hook;
use lines::{LineSegmentCulled, LineVisibility};

extern crate web_sys;

#[macro_use]
extern crate approx; // For the macro relative_eq!

#[wasm_bindgen]
pub fn mesh_to_svg_lines(
    canvas_width: i32,
    canvas_height: i32,
    mesh_indices: Box<[usize]>,
    mesh_vertices: Box<[f32]>,
    mesh_normals: Box<[f32]>,
    wireframe_indices: Box<[usize]>,
    wireframe_vertices: Box<[f32]>,
    view_matrix: Box<[f32]>,
    projection_matrix: Box<[f32]>,
    mesh_world_matrix: Box<[f32]>,
    camera_forward_vector: Box<[f32]>,
) -> String {
    set_panic_hook();

    let mesh = Mesh::new(mesh_indices, mesh_vertices, mesh_normals);
    let wireframe = Wireframe::new(wireframe_indices, wireframe_vertices);
    let scene = scene::Scene::new(
        canvas_width,
        canvas_height,
        view_matrix,
        projection_matrix,
        mesh_world_matrix,
        camera_forward_vector,
    );

    log!(
        "adjacency info: {adjacency}",
        adjacency = mesh.compute_adjacency().len()
    );

    let point = Point2::new(10.0, 10.0);

    let unprojected = scene.unproject_point(&point);
    let reprojected = scene.project_point(&unprojected);

    log!(
        "point: {point}, \nunprojected: {unprojected}, \nreprojected: {reprojected}",
        point = point,
        unprojected = unprojected,
        reprojected = reprojected
    );

    let point_b = Point3::new(10.0, 10.0, 10.0);
    let projected_point_b = scene.project_point(&point_b);
    let unprojected_point_b = scene.unproject_point(&projected_point_b);

    log!(
        "point_b: {point}, \nprojected_point_b: {unprojected}, \nunprojected_point_b: {reprojected}",
        point = point_b,
        unprojected = projected_point_b,
        reprojected = unprojected_point_b
    );

    // scene.project_point(Point3::new(0.0, 0.0, 0.0));

    // let segments = mesh
    //     .vertices
    //     .into_iter()
    //     .map(|vertex| {
    //         let transformed = scene.project_point(vertex);
    ////         let transformed = Point2::new(0.0, 0.0);
    //
    //         LineSegment {
    //             visibility: LineVisibility::VISIBLE,
    //             from: transformed.clone(),
    //             to: transformed.clone(),
    //         }
    //     })
    //     .collect();

    // let mut segments: Vec<LineSegmentCulled> = vec![];
    //
    // // show wireframe
    // // for (i, vertex) in wireframe.points.iter().enumerate().step_by(2) {
    // //     let from = scene.project_point(vertex.to_owned());
    // //     let to = scene.project_point(wireframe.points[i + 1].to_owned());
    // //
    // //     segments.push(LineSegment2 {
    // //         visibility: LineVisibility::VISIBLE,
    // //         from,
    // //         to,
    // //     })
    // // }
    //
    // // show sharp edges
    // for segment in mesh.find_edge_lines(&scene, false) {
    //     let from = scene.project_point(segment.from);
    //     let to = scene.project_point(segment.to);
    //
    //     segments.push(LineSegmentCulled {
    //         visibility: LineVisibility::VISIBLE,
    //         line_segment: LineSegment2 { from, to },
    //     })
    // }

    let mut edges = mesh.find_edge_lines(&scene, false);
    edges.append(&mut wireframe.edges());

    let projected = scene.project_lines(&edges);

    let split_lines = split_lines_by_intersection(projected);

    let segments: Vec<LineSegmentCulled> = split_lines
        .iter()
        .flat_map(|projected_line| {
            log!(
                "sub segment count: {segments}",
                segments = projected_line.split_screen_space_lines.len()
            );

            let culled: Vec<LineSegmentCulled> = projected_line
                .split_screen_space_lines
                .iter()
                .map(|line_segment| LineSegmentCulled {
                    visibility: LineVisibility::VISIBLE,
                    line_segment: line_segment.to_owned(),
                })
                .collect();

            culled
        })
        .collect();

    log!("segments: {segments}", segments = segments.len());

    // let segments = vec![
    //     LineSegment {
    //         visibility: LineVisibility::VISIBLE,
    //         from: Point2::new(0.0, 0.0),
    //         to: Point2::new(50.0, 0.0),
    //     },
    //     LineSegment {
    //         visibility: LineVisibility::VISIBLE,
    //         from: Point2::new(50.0, 0.0),
    //         to: Point2::new(0.0, 50.0),
    //     },
    //     LineSegment {
    //         visibility: LineVisibility::VISIBLE,
    //         from: Point2::new(0.0, 50.0),
    //         to: Point2::new(50.0, 50.0),
    //     }
    // ];

    svg_renderer::screen_space_lines_to_fitted_svg(
        segments,
        SvgConfig {
            width: canvas_width,
            height: canvas_height,
            margin: 100,
            visible: SvgLineConfig {
                stroke_width: 4,
                stroke: "black",
            },
            obscured: None,
            fit_lines: true,
        },
    )
}
