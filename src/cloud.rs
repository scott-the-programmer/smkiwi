use dioxus::prelude::*;
use std::collections::VecDeque;

const CAPACITY: usize = 40;
const TIMEOUT: u64 = 10;
const MAX_QUEUE: usize = 6000;
// Prices are integer microdollars, deliberately fictional.
const SERVER_RATE: u64 = 2000;
const REQUEST_RATE: u64 = 20;

#[derive(Clone)]
struct Simulation {
    seconds: u64,
    traffic: usize,
    servers: [bool; 6],
    queue: VecDeque<u64>,
    arrived: u64,
    served: u64,
    dropped: u64,
    last_served: usize,
    last_dropped: usize,
    compute: u64,
    viral: u64,
    history: VecDeque<usize>,
}

impl Default for Simulation {
    fn default() -> Self {
        Self {
            seconds: 0,
            traffic: 60,
            servers: [true, true, false, false, false, false],
            queue: VecDeque::new(),
            arrived: 0,
            served: 0,
            dropped: 0,
            last_served: 0,
            last_dropped: 0,
            compute: 0,
            viral: 0,
            history: VecDeque::new(),
        }
    }
}

impl Simulation {
    fn online(&self) -> usize {
        self.servers.iter().filter(|&&online| online).count()
    }

    fn incoming(&self) -> usize {
        self.traffic * if self.viral > 0 { 5 } else { 1 }
    }

    fn tick(&mut self) {
        self.seconds += 1;
        self.last_dropped = 0;
        while self
            .queue
            .front()
            .is_some_and(|&arrival| self.seconds - arrival >= TIMEOUT)
        {
            self.queue.pop_front();
            self.last_dropped += 1;
        }
        let incoming = self.incoming();
        self.arrived += incoming as u64;
        let admitted = incoming.min(MAX_QUEUE - self.queue.len());
        self.last_dropped += incoming - admitted;
        self.queue
            .extend(std::iter::repeat_n(self.seconds, admitted));
        self.last_served = self.queue.len().min(self.online() * CAPACITY);
        self.queue.drain(..self.last_served);
        self.served += self.last_served as u64;
        self.dropped += self.last_dropped as u64;
        self.compute += self.online() as u64 * SERVER_RATE;
        self.viral = self.viral.saturating_sub(1);
        if self.history.len() == 60 {
            self.history.pop_front();
        }
        self.history.push_back(self.queue.len());
    }

    fn message(&self) -> &'static str {
        if self.online() == 0 {
            "You unplugged the cloud. Customers noticed."
        } else if self.last_dropped > 0 {
            "Requests are being dropped. Finance suggests positive thinking."
        } else if self.queue.len() > 200 {
            "The queue has formed a support group."
        } else if self.online() > 2 && self.incoming() < (self.online() - 1) * CAPACITY {
            "Lovely spare capacity. You are paying for all of it."
        } else {
            "Everything is fine. Please do not post the link."
        }
    }
}

fn dollars(microdollars: u64) -> String {
    format!("${:.2}", microdollars as f64 / 1_000_000.)
}

#[component]
pub fn CloudInvoice(active: ReadOnlySignal<bool>, instance: u64) -> Element {
    let mut sim = use_signal(Simulation::default);
    let mut paused = use_signal(|| false);
    use_future(move || async move {
        loop {
            gloo_timers::future::TimeoutFuture::new(250).await;
            if active() && !paused() {
                sim.write().tick();
            }
        }
    });
    let state = sim.read();
    let online = state.online();
    let capacity = online * CAPACITY;
    let requests = state.served * REQUEST_RATE;
    let total = dollars(state.compute + requests);
    let compute = dollars(state.compute);
    let request_cost = dollars(requests);
    let hourly = dollars(
        (online as u64 * SERVER_RATE + state.incoming().min(capacity) as u64 * REQUEST_RATE) * 3600,
    );
    let elapsed = format!("{:02}:{:02}", state.seconds / 60, state.seconds % 60);
    let oldest = state
        .queue
        .front()
        .map_or(0, |&arrival| state.seconds - arrival);
    let flow_packets = if state.incoming() == 0 {
        0
    } else {
        (state.incoming() / CAPACITY).clamp(2, 8)
    };
    let queued_packets = state.queue.len().div_ceil(CAPACITY).min(18);
    let flow_duration = 1_500usize.saturating_sub(state.incoming().min(1_000));
    let points = state
        .history
        .iter()
        .enumerate()
        .map(|(i, queued)| {
            format!(
                "{},{}",
                i * 5,
                64. - *queued as f64 / MAX_QUEUE as f64 * 60.
            )
        })
        .collect::<Vec<_>>()
        .join(" ");
    rsx! {
        div { class: "cloud-app",
            div { class: "cloud-intro",
                div { h2 { "Your cloud. Your problem." } p { "Keep requests moving. Try not to bankrupt an imaginary company." } }
                span { class: "cloud-time", "{elapsed}" small { if paused() { "Paused" } else { "Simulated time · 4×" } } }
            }
            div { class: "cloud-layout",
                div { class: "cloud-operations",
                    div { class: "cloud-traffic",
                        label { r#for: "cloud-traffic-{instance}", "Incoming traffic" strong { "{state.incoming()} req/s" } }
                        input { id: "cloud-traffic-{instance}", r#type: "range", min: "0", max: "240", step: "10", value: "{state.traffic}",
                            oninput: move |event| { if let Ok(value) = event.value().parse::<usize>() { sim.write().traffic = value.min(240); } }
                        }
                        div { class: "cloud-actions",
                            button { class: "cloud-viral", disabled: state.viral > 0, onclick: move |_| sim.write().viral = 30,
                                if state.viral > 0 { "Viral for {state.viral}s · 5× traffic" } else { "Go viral ↗" }
                            }
                            span { "30 simulated seconds of fame" }
                        }
                    }
                    div { class: "cloud-rack",
                        div { class: "cloud-rack-heading", strong { "Server cupboard" } span { "{online}/6 online · {capacity} req/s" } }
                        for (index, &powered) in state.servers.iter().enumerate() {
                            button { key: "{index}", class: if powered { "cloud-server powered" } else { "cloud-server" },
                                aria_label: "Server {index + 1} power", aria_pressed: powered,
                                onclick: move |_| { let mut state = sim.write(); state.servers[index] = !state.servers[index]; },
                                span { class: "cloud-led" }
                                strong { "scott-cloud-0{index + 1}" }
                                span { class: "cloud-vents", aria_hidden: "true", "▥ ▥ ▥" }
                                span { class: "cloud-power", if powered { "Online ⏻" } else { "Offline ⏻" } }
                            }
                        }
                        p { "Click a server to power it on or pull the plug. Each handles 40 req/s." }
                    }
                    div { class: if paused() { "cloud-flow paused" } else { "cloud-flow" },
                        div { class: "cloud-flow-heading",
                            strong { "Live request conveyor" }
                            span { "FIFO · oldest leaves first" }
                        }
                        div {
                            class: "cloud-flow-route",
                            role: "img",
                            "aria-label": "Animated request flow: {state.incoming()} incoming per second, {state.queue.len()} waiting, {state.last_served} served and {state.last_dropped} dropped in the last step",
                            span { class: "cloud-flow-node incoming", "IN" }
                            div { class: "cloud-flow-lane",
                                for index in 0..flow_packets {
                                    span {
                                        key: "{index}",
                                        class: "cloud-request",
                                        style: "--flow-duration:{flow_duration}ms;--flow-delay:-{index * 170}ms",
                                    }
                                }
                                div { class: if queued_packets > 0 { "cloud-buffer occupied" } else { "cloud-buffer" },
                                    small { "QUEUE" }
                                    div { class: "cloud-buffer-packets",
                                        for index in 0..queued_packets {
                                            span { key: "queued-{index}" }
                                        }
                                    }
                                }
                            }
                            span { class: "cloud-flow-node completed", "DONE" }
                        }
                        div { class: "cloud-flow-stats",
                            span { strong { "{state.incoming()}" } " arriving/s" }
                            span { strong { "{state.queue.len()}" } " waiting" }
                            span { class: "served", strong { "{state.last_served}" } " served/s" }
                            span { class: if state.last_dropped > 0 { "dropped active" } else { "dropped" }, strong { "{state.last_dropped}" } " dropped/s" }
                        }
                    }
                    div { class: "cloud-queue",
                        div { strong { "Queue history" } span { "Oldest {oldest}s / 10s timeout" } }
                        svg { view_box: "0 0 300 70", role: "img", "aria-label": "Queued requests over the last 60 simulated seconds, fixed scale zero to 6000", preserve_aspect_ratio: "none",
                            line { x1: "0", x2: "300", y1: "64", y2: "64", stroke: "#c5d9e7" }
                            polyline { points: "{points}", fill: "none", stroke: "#2176ae", stroke_width: "2", vector_effect: "non-scaling-stroke" }
                        }
                        div { class: "cloud-counters", span { "{state.last_served} served/s" } span { "{state.last_dropped} dropped/s" } }
                    }
                }
                aside { class: "cloud-receipt", aria_label: "Fictional cloud invoice",
                    div { class: "cloud-receipt-heading", span { "☁" } h3 { "Cloud Nine-ish" } p { "Invoice for services you clicked" } }
                    dl {
                        div { dt { "Compute" } dd { "{compute}" } }
                        div { dt { "Requests" } dd { "{request_cost}" } }
                        div { dt { "Emotional support" } dd { "Not included" } }
                        div { class: "cloud-total", dt { "Total so far" } dd { "{total}" } }
                    }
                    p { class: "cloud-run-rate", strong { "{hourly}/hour" } " at current traffic and capacity" }
                    div { class: "cloud-totals", span { "{state.served} served" } span { "{state.dropped} lost" } }
                    p { class: "cloud-fiction", "Fictional USD. $0.002/server-second + $0.00002/completed request. Powered-off servers are free. No real charges." }
                    p { class: "cloud-finance", "{state.message()}" }
                }
            }
            div { class: "cloud-toolbar",
                button { aria_pressed: paused(), onclick: move |_| paused.toggle(), if paused() { "Resume simulation" } else { "Pause simulation" } }
                button { onclick: move |_| { sim.set(Simulation::default()); paused.set(false); }, "Reset simulation" }
                span { "Rust / WASM · runs locally" }
            }
            details { class: "cloud-explainer", summary { "Inside the simulation" }
                p { "Rust advances one simulated second every 250 ms. Requests enter a first-in, first-out queue; online servers complete up to 40 each per step. Requests waiting 10 seconds time out. Queue capacity is 6,000; overflow is dropped. Compute is billed even when idle. The hourly estimate assumes steady traffic and ignores queued work." }
                p { "The chart shows the last 60 steps on a fixed 0–6,000 scale. Minimizing this window or zooming another pauses it; closing resets it. Background browser throttling can slow the simulation." }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capacity_and_invoice_follow_power_state() {
        let mut sim = Simulation::default();
        sim.tick();
        assert_eq!((sim.served, sim.compute, sim.queue.len()), (60, 4000, 0));
        assert_eq!(sim.served * REQUEST_RATE, 1200);
        sim.servers = [false; 6];
        sim.tick();
        assert_eq!((sim.served, sim.compute, sim.queue.len()), (60, 4000, 60));
    }

    #[test]
    fn queued_requests_expire_at_ten_seconds_and_recover() {
        let mut sim = Simulation {
            servers: [false; 6],
            ..Simulation::default()
        };
        for _ in 0..10 {
            sim.tick();
        }
        assert_eq!((sim.queue.len(), sim.dropped), (600, 0));
        sim.tick();
        assert_eq!((sim.queue.len(), sim.dropped), (600, 60));
        sim.servers = [true; 6];
        sim.traffic = 0;
        for _ in 0..3 {
            sim.tick();
        }
        assert!(sim.queue.is_empty());
        assert_eq!(sim.arrived, sim.served + sim.dropped);
    }

    #[test]
    fn viral_traffic_is_bounded_and_ends_after_thirty_steps() {
        let mut sim = Simulation {
            traffic: 240,
            viral: 30,
            servers: [false; 6],
            ..Simulation::default()
        };
        for _ in 0..30 {
            sim.tick();
            assert!(sim.queue.len() <= MAX_QUEUE);
            assert_eq!(
                sim.arrived,
                sim.served + sim.dropped + sim.queue.len() as u64
            );
        }
        assert_eq!(sim.arrived, 36_000);
        assert_eq!(sim.incoming(), 240);
        assert!(sim.dropped > 0);
        for _ in 0..100 {
            sim.tick();
        }
        assert_eq!(sim.history.len(), 60);
    }
}
