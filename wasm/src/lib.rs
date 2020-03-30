mod mesh;
mod scene;
mod svg_renderer;
mod types;
mod utils;

use mesh::Mesh;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern crate nalgebra as na;
use na::{Point2};

use crate::svg_renderer::{SvgConfig, SvgLineConfig};
use types::{ LineSegment, LineVisibility};
use crate::utils::set_panic_hook;

#[macro_use]
extern crate approx; // For the macro relative_eq!

#[wasm_bindgen]
pub fn mesh_to_svg_lines(
    canvas_width: i32,
    canvas_height: i32,
    mesh_indices: Box<[i32]>,
    mesh_vertices: Box<[f32]>,
    mesh_normals: Option<Box<[f32]>>,
    wireframe_indices: Box<[i32]>,
    wireframe_vertices: Box<[f32]>,
    transformation_matrix: Box<[f32]>,
    view_matrix: Box<[f32]>,
    projection_matrix: Box<[f32]>,
    mesh_world_matrix: Box<[f32]>,
    camera_forward_vector: Box<[f32]>,
) -> String {

    set_panic_hook();

    let mesh = Mesh::new(mesh_indices, mesh_vertices, mesh_normals);
    let wireframe = Mesh::new_wireframe(wireframe_indices, wireframe_vertices);
    let scene = scene::Scene::new(
        canvas_width,
        canvas_height,
        transformation_matrix,
        view_matrix,
        projection_matrix,
        mesh_world_matrix,
        camera_forward_vector,
    );

    let segments = mesh
        .vertices
        .into_iter()
        .map(|vertex| {
            let transformed = scene.project_point(vertex);

            LineSegment {
                visibility: LineVisibility::VISIBLE,
                from: transformed.clone(),
                to: transformed.clone(),
            }
        })
        .collect();

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
            width: 800,
            height: 600,
            margin: 100,
            visible: SvgLineConfig {
                stroke_width: 4,
                stroke: "black",
            },
            obscured: None,
        },
    )
}
