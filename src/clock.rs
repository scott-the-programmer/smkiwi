use dioxus::prelude::*;
use std::{
    f64::consts::{FRAC_PI_2, PI, TAU},
    fmt::Write,
};

#[derive(Clone, Copy)]
struct ClockTime {
    hour: f64,
    minute: f64,
    second: f64,
}
impl ClockTime {
    fn now() -> Self {
        let date = js_sys::Date::new_0();
        Self {
            hour: date.get_hours() as f64,
            minute: date.get_minutes() as f64,
            second: date.get_seconds() as f64 + date.get_milliseconds() as f64 / 1000.,
        }
    }
    fn angles(self) -> [f64; 3] {
        let minute = self.minute + self.second / 60.;
        [
            ((self.hour % 12.) + minute / 60.) / 12. * TAU - FRAC_PI_2,
            minute / 60. * TAU - FRAC_PI_2,
            self.second / 60. * TAU - FRAC_PI_2,
        ]
    }
    fn label(self) -> String {
        format!(
            "{:02}:{:02}:{:02}",
            self.hour as u32, self.minute as u32, self.second as u32
        )
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}
#[derive(Clone, Copy)]
struct Segment {
    from: Point,
    to: Point,
}

// Geometry inspired by egui's fractal_clock demo:
// https://github.com/emilk/egui/blob/main/crates/egui_demo_app/src/apps/fractal_clock.rs
// The second and minute tips spawn both hands, rotated relative to the hour
// hand plus half a turn. This makes the entire tree evolve every second.
fn branches(time: ClockTime, depth: u32, length: f64) -> Vec<Vec<Segment>> {
    let [hour, minute, second] = time.angles();
    let length = length.clamp(0.4, 0.85);
    let origin = Point { x: 0., y: 0. };
    let root: Vec<_> = [(second, length), (minute, length), (hour, 0.5)]
        .into_iter()
        .map(|(angle, size)| Segment {
            from: origin,
            to: Point {
                x: size * angle.cos(),
                y: size * angle.sin(),
            },
        })
        .collect();
    let mut nodes = root[..2].to_vec();
    let mut layers = vec![root];
    for _ in 0..depth.min(10) {
        let mut next = Vec::with_capacity(nodes.len() * 2);
        for angle in [second - hour + PI, minute - hour + PI] {
            let (sin, cos) = angle.sin_cos();
            for node in &nodes {
                let dx = node.to.x - node.from.x;
                let dy = node.to.y - node.from.y;
                next.push(Segment {
                    from: node.to,
                    to: Point {
                        x: node.to.x + length * (dx * cos - dy * sin),
                        y: node.to.y + length * (dx * sin + dy * cos),
                    },
                });
            }
        }
        layers.push(next.clone());
        nodes = next;
    }
    layers
}

// One SVG path per generation, rather than thousands of DOM line elements.
fn path(segments: &[Segment]) -> String {
    let mut result = String::with_capacity(segments.len() * 40);
    for s in segments {
        let _ = write!(
            result,
            "M{:.3},{:.3}L{:.3},{:.3}",
            s.from.x * 100.,
            s.from.y * 100.,
            s.to.x * 100.,
            s.to.y * 100.
        );
    }
    result
}

#[component]
pub fn FractalClock(instance: u64, active: ReadOnlySignal<bool>) -> Element {
    let mut now = use_signal(ClockTime::now);
    let mut paused = use_signal(|| false);
    let mut depth = use_signal(|| 9u32);
    let mut zoom = use_signal(|| 0.25f64);
    let mut length = use_signal(|| 0.8f64);
    use_future(move || async move {
        loop {
            gloo_timers::future::TimeoutFuture::new(33).await;
            if !paused() && active() {
                now.set(ClockTime::now());
            }
        }
    });
    let time = now();
    let layers = branches(time, depth(), length());
    let line_count: usize = layers.iter().map(Vec::len).sum();
    let extent = 50. / zoom();
    let colors = [
        "var(--honey-bronze)",
        "var(--cool-sky)",
        "var(--tomato)",
        "var(--bright-teal-blue)",
        "var(--copperwood)",
    ];
    rsx! {
        div { class: "fractal-clock",
            div { class: "clock-stage",
                svg { class: "clock-svg", view_box: "{-extent} {-extent} {extent * 2.} {extent * 2.}", role: "img", "aria-label": "Fractal clock: {time.label()}",
                    for (level, segments) in layers.iter().enumerate() {
                        path { key: "{level}", class: "fractal-layer", d: path(segments),
                            stroke: "{colors[level % colors.len()]}",
                            stroke_width: "{1.8 * 0.9f64.powi(level as i32)}",
                            opacity: if level == 0 { 1. } else { 0.7 * 0.8f64.powi(level as i32) },
                            "vector-effect": "non-scaling-stroke",
                        }
                    }
                }
                div { class: "clock-readout",
                    time { "{time.label()}" }
                    span { class: "clock-state", if paused() { "Ⅱ PAUSED" } else { "● LIVE" } }
                }
                details { class: "clock-settings",
                    summary { "Settings" }
                    div { class: "clock-controls",
                        button { class: "clock-pause", aria_pressed: paused(), onclick: move |_| {
                            let was_paused = paused(); paused.set(!was_paused);
                            if was_paused { now.set(ClockTime::now()); }
                        }, if paused() { "▷ Resume" } else { "Ⅱ Pause" } }
                        span { class: "clock-line-count", "{line_count} lines" }
                        label { r#for: "clock-depth-{instance}", "Depth {depth}" }
                        input { id: "clock-depth-{instance}", r#type: "range", min: "0", max: "10", value: "{depth}", oninput: move |e| {
                            if let Ok(value) = e.value().parse::<u32>() { depth.set(value.min(10)); }
                        } }
                        label { r#for: "clock-zoom-{instance}", "Zoom" }
                        input { id: "clock-zoom-{instance}", r#type: "range", min: "0.1", max: "0.6", step: "0.01", value: "{zoom}", oninput: move |e| {
                            if let Ok(value) = e.value().parse::<f64>() { zoom.set(value.clamp(0.1, 0.6)); }
                        } }
                        label { r#for: "clock-length-{instance}", "Branch length" }
                        input { id: "clock-length-{instance}", r#type: "range", min: "0.4", max: "0.85", step: "0.01", value: "{length}", oninput: move |e| {
                            if let Ok(value) = e.value().parse::<f64>() { length.set(value.clamp(0.4, 0.85)); }
                        } }
                        button { class: "clock-pause", onclick: move |_| {
                            depth.set(9); zoom.set(0.25); length.set(0.8); paused.set(false); now.set(ClockTime::now());
                        }, "Reset" }
                    }
                }
            }
            footer { class: "clock-credit",
                "Inspired by the "
                a { href: "https://www.egui.rs/#clock", target: "_blank", rel: "noopener noreferrer", "egui fractal clock sample" }
                "."
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> ClockTime {
        ClockTime {
            hour: 10.,
            minute: 10.,
            second: 30.,
        }
    }
    #[test]
    fn recursive_branch_count_is_bounded() {
        for depth in 0..=10 {
            assert_eq!(
                branches(sample(), depth, 0.8)
                    .iter()
                    .map(Vec::len)
                    .sum::<usize>(),
                (1 << (depth + 2)) - 1
            );
        }
        assert_eq!(branches(sample(), 100, 0.8).len(), 11);
    }
    #[test]
    fn noon_roots_point_up_and_children_turn_back() {
        let layers = branches(
            ClockTime {
                hour: 12.,
                minute: 0.,
                second: 0.,
            },
            1,
            0.8,
        );
        assert!(layers[0]
            .iter()
            .all(|s| s.to.x.abs() < 1e-10 && s.to.y < 0.));
        assert!(layers[1].iter().all(|s| s.to.y > s.from.y));
        assert_eq!(layers[0].len(), 3);
        assert_eq!(layers[1].len(), 4);
    }
    #[test]
    fn descendants_shrink_and_attach_to_parent_tips() {
        let layers = branches(sample(), 4, 0.8);
        for level in 1..layers.len() {
            for child in &layers[level] {
                assert!(layers[level - 1]
                    .iter()
                    .any(|parent| parent.to == child.from));
                let length = (child.to.x - child.from.x).hypot(child.to.y - child.from.y);
                assert!((length - 0.8f64.powi(level as i32 + 1)).abs() < 1e-10);
            }
        }
    }
    #[test]
    fn seconds_animate_the_fractal_not_just_a_separate_hand() {
        let a = branches(sample(), 4, 0.8);
        let b = branches(
            ClockTime {
                second: 31.,
                ..sample()
            },
            4,
            0.8,
        );
        assert_ne!(path(&a[4]), path(&b[4]));
        assert_eq!(sample().label(), "10:10:30");
    }
}
