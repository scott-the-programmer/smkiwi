use dioxus::prelude::*;

const STATES: [&str; 2] = ["Rainy", "Sunny"];
const INITIAL: [f64; 2] = [0.6, 0.4];
const TRANSITION: [[f64; 2]; 2] = [[0.7, 0.3], [0.4, 0.6]];
const EMISSION: [[f64; 3]; 2] = [[0.1, 0.4, 0.5], [0.6, 0.3, 0.1]];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Observation {
    Walk,
    Shop,
    Clean,
}

impl Observation {
    fn index(self) -> usize {
        match self {
            Self::Walk => 0,
            Self::Shop => 1,
            Self::Clean => 2,
        }
    }

    fn name(self) -> &'static str {
        match self {
            Self::Walk => "Walk",
            Self::Shop => "Shop",
            Self::Clean => "Clean",
        }
    }

    fn icon(self) -> &'static str {
        match self {
            Self::Walk => "↗",
            Self::Shop => "▣",
            Self::Clean => "✦",
        }
    }

    fn next(self) -> Self {
        match self {
            Self::Walk => Self::Shop,
            Self::Shop => Self::Clean,
            Self::Clean => Self::Walk,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum View {
    Forward,
    Backward,
    Smoothed,
}

impl View {
    fn name(self) -> &'static str {
        match self {
            Self::Forward => "Forward α",
            Self::Backward => "Backward β",
            Self::Smoothed => "Posterior γ",
        }
    }
}

#[derive(Debug)]
struct Analysis {
    alpha: Vec<[f64; 2]>,
    beta: Vec<[f64; 2]>,
    posterior: Vec<[f64; 2]>,
    likelihood: f64,
}

impl Analysis {
    fn calculate(observations: &[Observation]) -> Self {
        debug_assert!(!observations.is_empty());
        let count = observations.len();
        let mut alpha = vec![[0.0; 2]; count];
        for state in 0..2 {
            alpha[0][state] = INITIAL[state] * EMISSION[state][observations[0].index()];
        }
        for time in 1..count {
            for state in 0..2 {
                alpha[time][state] = EMISSION[state][observations[time].index()]
                    * (0..2)
                        .map(|previous| alpha[time - 1][previous] * TRANSITION[previous][state])
                        .sum::<f64>();
            }
        }

        let mut beta = vec![[0.0; 2]; count];
        beta[count - 1] = [1.0, 1.0];
        for time in (0..count - 1).rev() {
            for state in 0..2 {
                beta[time][state] = (0..2)
                    .map(|next| {
                        TRANSITION[state][next]
                            * EMISSION[next][observations[time + 1].index()]
                            * beta[time + 1][next]
                    })
                    .sum();
            }
        }

        let likelihood = alpha[count - 1].iter().sum();
        let posterior = (0..count)
            .map(|time| {
                let weights = [
                    alpha[time][0] * beta[time][0],
                    alpha[time][1] * beta[time][1],
                ];
                let total = weights[0] + weights[1];
                [weights[0] / total, weights[1] / total]
            })
            .collect();

        Self {
            alpha,
            beta,
            posterior,
            likelihood,
        }
    }

    fn display_probability(&self, view: View, time: usize, state: usize) -> f64 {
        match view {
            View::Forward => normalized(self.alpha[time])[state],
            View::Backward => normalized(self.beta[time])[state],
            View::Smoothed => self.posterior[time][state],
        }
    }
}

#[component]
pub fn ForwardBackward(instance: u64) -> Element {
    let mut observations = use_signal(|| {
        vec![
            Observation::Walk,
            Observation::Shop,
            Observation::Clean,
            Observation::Walk,
        ]
    });
    let mut selected = use_signal(|| 0usize);
    let mut view = use_signal(|| View::Smoothed);
    let analysis = Analysis::calculate(&observations());
    let time = selected().min(observations().len() - 1);
    let likely_state = if analysis.posterior[time][0] >= analysis.posterior[time][1] {
        0
    } else {
        1
    };
    let likelihood_text = format!("{:.6}", analysis.likelihood);
    let posterior_text = format!(
        "{:.1}% posterior",
        analysis.posterior[time][likely_state] * 100.0
    );
    let alpha_text = format!(
        "α = [{:.5}, {:.5}]",
        analysis.alpha[time][0], analysis.alpha[time][1]
    );
    let beta_text = format!(
        "β = [{:.5}, {:.5}]",
        analysis.beta[time][0], analysis.beta[time][1]
    );
    let grid_style = format!("--fb-columns: {}", observations().len());

    rsx! {
        div { class: "fb-app",
            header { class: "fb-intro",
                div {
                    p { class: "eyebrow", "HIDDEN MARKOV MODEL LAB" }
                    h2 { "What was the weather?" }
                    p { "Infer hidden weather states from a sequence of observed activities." }
                }
                a { href: "https://en.wikipedia.org/wiki/Forward%E2%80%93backward_algorithm", target: "_blank", rel: "noreferrer", "Algorithm ↗" }
            }

            section { class: "fb-observations", aria_label: "Observation sequence",
                div { class: "fb-section-heading",
                    strong { "1 · Set the evidence" }
                    span { "Click an activity to change it" }
                }
                div { class: "fb-sequence",
                    for (index, observation) in observations().iter().copied().enumerate() {
                        {let display_index = index + 1; rsx! {
                            button {
                                key: "observation-{index}",
                                class: if time == index { "fb-observation selected" } else { "fb-observation" },
                                aria_label: "Observation {display_index}: {observation.name()}. Click to change",
                                onclick: move |_| {
                                    observations.write()[index] = observation.next();
                                    selected.set(index);
                                },
                                span { "{observation.icon()}" }
                                strong { "{observation.name()}" }
                                small { "t{index}" }
                            }
                        }}
                    }
                    div { class: "fb-sequence-actions",
                        button {
                            title: "Add observation",
                            aria_label: "Add observation",
                            disabled: observations().len() >= 7,
                            onclick: move |_| observations.write().push(Observation::Walk),
                            "+"
                        }
                        button {
                            title: "Remove last observation",
                            aria_label: "Remove last observation",
                            disabled: observations().len() <= 2,
                            onclick: move |_| {
                                observations.write().pop();
                                selected.set(selected().min(observations().len() - 1));
                            },
                            "−"
                        }
                    }
                }
            }

            section { class: "fb-visualizer",
                div { class: "fb-section-heading",
                    strong { "2 · Run both passes" }
                    span { "Sequence likelihood: {likelihood_text}" }
                }
                div { class: "fb-view-tabs", role: "group", aria_label: "Probability view",
                    for option in [View::Forward, View::Backward, View::Smoothed] {
                        button {
                            class: if view() == option { "active" } else { "" },
                            aria_pressed: view() == option,
                            onclick: move |_| view.set(option),
                            "{option.name()}"
                        }
                    }
                }
                div { class: "fb-pass-note",
                    match view() {
                        View::Forward => rsx! { span { class: "fb-arrow", "→" } "Past evidence flows left to right." },
                        View::Backward => rsx! { span { class: "fb-arrow", "←" } "Future evidence flows right to left." },
                        View::Smoothed => rsx! { span { class: "fb-arrow", "↔" } "Combine α × β to use the whole sequence." },
                    }
                }
                div { class: "fb-grid", style: "{grid_style}",
                    for (index, observation) in observations().iter().copied().enumerate() {
                        button {
                            key: "state-{index}",
                            class: if time == index { "fb-time selected" } else { "fb-time" },
                            onclick: move |_| selected.set(index),
                            aria_label: "Inspect time {index}, {observation.name()}",
                            div { class: "fb-time-label", "t{index}" span { "{observation.name()}" } }
                            for state in 0..2 {
                                {let probability = analysis.display_probability(view(), index, state);
                                let percent = probability * 100.0;
                                let percent_text = format!("{percent:.1}%");
                                let meter_width = format!("width: {percent}%");
                                rsx! {
                                    div { class: if state == 0 { "fb-state rainy" } else { "fb-state sunny" },
                                        div { class: "fb-state-name", "{STATES[state]}" strong { "{percent_text}" } }
                                        div { class: "fb-meter", span { style: "{meter_width}" } }
                                    }
                                }}
                            }
                        }
                    }
                }
            }

            section { class: "fb-inspector",
                div { class: "fb-verdict",
                    span { "Most likely at t{time}" }
                    strong { "{STATES[likely_state]}" }
                    em { "{posterior_text}" }
                }
                div { class: "fb-math",
                    div { span { "FORWARD" } strong { "{alpha_text}" } small { "P(evidence through t, state at t)" } }
                    div { span { "BACKWARD" } strong { "{beta_text}" } small { "P(future evidence | state at t)" } }
                    div { span { "SMOOTH" } strong { "normalize(α × β)" } small { "Posterior state probability" } }
                }
            }

            details { class: "fb-model",
                summary { "Model probabilities" }
                div {
                    table {
                        caption { "Transition P(next | current)" }
                        thead { tr { th { "" } th { "Rainy" } th { "Sunny" } } }
                        tbody {
                            tr { th { "Rainy" } td { "0.70" } td { "0.30" } }
                            tr { th { "Sunny" } td { "0.40" } td { "0.60" } }
                        }
                    }
                    table {
                        caption { "Emission P(activity | state)" }
                        thead { tr { th { "" } th { "Walk" } th { "Shop" } th { "Clean" } } }
                        tbody {
                            tr { th { "Rainy" } td { "0.10" } td { "0.40" } td { "0.50" } }
                            tr { th { "Sunny" } td { "0.60" } td { "0.30" } td { "0.10" } }
                        }
                    }
                    p { "Initial state: Rainy 0.60 · Sunny 0.40. This is the classic Wikipedia weather example." }
                }
            }
            span { class: "fb-instance", "Experiment #{instance}" }
        }
    }
}

fn normalized(values: [f64; 2]) -> [f64; 2] {
    let total = values[0] + values[1];
    if total == 0.0 {
        [0.5, 0.5]
    } else {
        [values[0] / total, values[1] / total]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_the_classic_three_observation_example() {
        let analysis =
            Analysis::calculate(&[Observation::Walk, Observation::Shop, Observation::Clean]);
        assert!((analysis.likelihood - 0.033_612).abs() < 1e-9);
        assert!((analysis.posterior[0][0] - 0.231_702).abs() < 1e-6);
        assert!((analysis.posterior[1][0] - 0.624_063).abs() < 1e-6);
        assert!((analysis.posterior[2][0] - 0.863_977).abs() < 1e-6);
    }

    #[test]
    fn posterior_is_normalized_at_every_time_step() {
        let analysis = Analysis::calculate(&[
            Observation::Clean,
            Observation::Clean,
            Observation::Walk,
            Observation::Shop,
        ]);
        for probability in analysis.posterior {
            assert!((probability.iter().sum::<f64>() - 1.0).abs() < 1e-12);
        }
    }
}
