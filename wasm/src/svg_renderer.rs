use super::types::{LineSegment, LineVisibility};
use na::{Point2, Vector2};

#[derive(Copy, Clone)]
pub struct SvgLineConfig {
    pub stroke_width: i32,
    pub stroke: &'static str,
}

#[derive(Copy, Clone)]
pub struct SvgConfig {
    pub width: i32,
    pub height: i32,
    pub margin: i32,
    pub visible: SvgLineConfig,
    pub obscured: Option<SvgLineConfig>,
}

fn scale_screen_space_lines(
    screen_space_lines: Vec<LineSegment>,
    svg_config: SvgConfig,
) -> Vec<LineSegment> {
    let all_points: Vec<Point2<f32>> = screen_space_lines
        .iter()
        .flat_map(|seg| vec![seg.from, seg.to])
        .collect();

    let all_x_values: Vec<f32> = all_points.iter().map(|p| p[0]).collect();
    let max_x = all_x_values.iter().cloned().fold(std::f32::NAN, f32::max);
    let min_x = all_x_values.iter().cloned().fold(std::f32::NAN, f32::min);
    let all_y_values: Vec<f32> = all_points.iter().map(|p| p[1]).collect();
    let max_y = all_y_values.iter().cloned().fold(std::f32::NAN, f32::max);
    let min_y = all_y_values.iter().cloned().fold(std::f32::NAN, f32::min);

    let min_bound = Vector2::new(min_x, min_y);
    let max_bound = Vector2::new(max_x, max_y);

    let margin = Vector2::new(svg_config.margin as f32, svg_config.margin as f32);

    let canvas = Vector2::new(svg_config.width as f32, svg_config.height as f32) - margin;

    let viewport = max_bound - min_bound;
    let half_viewport = (viewport * 0.5) + min_bound;
    let half_canvas = (canvas * 0.5) + (margin * 0.5);

    let x_scale = canvas.x / viewport.x;
    let y_scale = canvas.y / viewport.y;
    let scale = f32::min(x_scale, y_scale);

    let scaled_points = screen_space_lines
        .iter()
        .map(|line| LineSegment {
            visibility: line.visibility,
            from: ((&line.from - half_viewport) * scale) + half_canvas,
            to: ((&line.to - half_viewport) * scale) + half_canvas,
        })
        .collect();

    scaled_points
}

pub fn screen_space_lines_to_fitted_svg(
    screen_space_lines: Vec<LineSegment>,
    svg_config: SvgConfig,
) -> String {
    let fitted_lines = scale_screen_space_lines(screen_space_lines, svg_config);

    let svg = line_segments_to_svg(fitted_lines, svg_config);

    svg
}

fn line_segments_to_svg(segments: Vec<LineSegment>, config: SvgConfig) -> String {
    let visible = segments
        .into_iter()
        .filter(|seg| match seg.visibility {
            LineVisibility::VISIBLE => true,
            _ => false,
        })
        .collect();

    format!(
        "<svg viewBox=\"0 0 {width} {height}\" xmlns=\"http://www.w3.org/2000/svg\">
{visible}
</svg>",
        width = config.width,
        height = config.height,
        visible = create_path_element(visible, config.visible)
    )
}

fn create_path_element(lines: Vec<LineSegment>, line_config: SvgLineConfig) -> String {
    let mut path_def = "".to_string();
    let mut current: Option<Point2<f32>> = None;

    for (_i, line) in lines.iter().enumerate() {
        let start = &line.from;
        let end = &line.to;

        match current {
            Some(current) if relative_eq!(current, start) => {
                path_def.push_str("L ");
            }
            _ => {
                path_def.push_str(format!("M {x} {y} ", x = start[0], y = start[1]).as_str());
            }
        }

        path_def.push_str(format!("{x} {y}", x = end[0], y = end[1]).as_str());

        current = Some(end.to_owned());
    }

    format!("<path d=\"{path_def}\" stroke=\"{stroke}\" fill=\"none\" stroke-width=\"{stroke_width}\" stroke-linecap=\"round\" />", path_def=path_def, stroke=line_config.stroke, stroke_width=line_config.stroke_width)
}
