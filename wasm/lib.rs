#[macro_use]
mod utils;
mod lines;
mod mesh;
mod scene;
mod svg_renderer;

use mesh::{Mesh, Wireframe};
use wasm_bindgen::prelude::*;

extern crate nalgebra as na;

use crate::lines::{get_visibility, split_lines_by_intersection};
use crate::scene::Ray;
use crate::svg_renderer::{SvgConfig, SvgLineConfig};
use crate::utils::set_panic_hook;
use lines::LineSegmentCulled;

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

    let mut edges = mesh.find_edge_lines(&scene, false);
    edges.append(&mut wireframe.edges());

    let projected = scene.project_lines(&edges);

    let split_lines = split_lines_by_intersection(projected);

    let mut ray = Ray::new(&mesh);
    let mut index: usize = 0;

    let segments: Vec<LineSegmentCulled> = split_lines
        .iter()
        .flat_map(|projected_line| {
            let culled: Vec<LineSegmentCulled> = projected_line
                .split_screen_space_lines
                .iter()
                .enumerate()
                .map(|(_j, line_segment)| {
                    let seg = LineSegmentCulled {
                        visibility: get_visibility(
                            &line_segment,
                            &projected_line.projected_line,
                            &scene,
                            &mut ray,
                        ),
                        line_segment: line_segment.to_owned(),
                    };

                    index += 1;

                    seg
                })
                .collect();

            culled
        })
        .collect();

    svg_renderer::screen_space_lines_to_fitted_svg(
        &segments,
        SvgConfig {
            width: canvas_width,
            height: canvas_height,
            margin: 100,
            visible: SvgLineConfig {
                stroke_width: 4,
                stroke: "black",
            },
            obscured: Some(SvgLineConfig {
                stroke_width: 2,
                stroke: "grey",
            }),
            fit_lines: true,
        },
    )
}
