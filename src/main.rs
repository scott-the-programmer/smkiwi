mod about;
mod clock;
mod toys;

use about::About;
use clock::FractalClock;
use dioxus::prelude::*;
use toys::Terminal;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    let mut tab = use_signal(|| "Workspace");
    rsx! {
        main { class: "app-shell",
            aside { class: "sidebar",
                a { class: "brand", href: "/", aria_label: "Scott OS home", span { class: "brand-mark", "s_" } div { strong { "Scott OS" } small { "LOCAL AI HARNESS" } } }
                p { class: "nav-caption", "WORKSPACE" }
                nav { aria_label: "Workspace navigation",
                    for (name, icon) in [("Workspace", "⌘"), ("About Scott", "◎"), ("Fractal Clock", "◷"), ("Sandbox Terminal", ">_")] {
                        button { class: if tab() == name { "nav-item active" } else { "nav-item" }, aria_pressed: tab() == name, aria_label: name, onclick: move |_| tab.set(name), span { "{icon}" } "{name}" }
                    }
                }
                div { class: "sidebar-note", span { class: "eyebrow", "THE BOUNDARY" } p { "Local inference. No API keys. No remote agents." } small { "Models generate text, not actions. The terminal is a separate sandbox." } }
                footer { class: "sidebar-footer", img { src: "/public/scott-avatar.png", alt: "" } div { strong { "Scott Murray" } small { "Auckland, New Zealand" } } a { href: "https://github.com/scott-the-programmer", target: "_blank", rel: "noopener noreferrer", aria_label: "Scott on GitHub", "↗" } }
            }
            div { class: "main-shell",
                header { class: "topbar", div { span { class: "breadcrumb", "personal /" } strong { "{tab}" } } span { class: "local-tag", span { "◉" } "BROWSER LOCAL" } }
                section { id: "harness", hidden: tab() != "Workspace", aria_label: "AI workspace" }
                section { class: "tool-panel", hidden: tab() != "About Scott", aria_label: "About Scott", About {} }
                section { class: "tool-panel", hidden: tab() != "Fractal Clock", aria_label: "Fractal Clock", h1 { "Fractal Clock" } p { class: "muted", "A little time away from the prompt." } FractalClock { instance: 1, active: tab() == "Fractal Clock" } }
                section { class: "tool-panel", hidden: tab() != "Sandbox Terminal", aria_label: "Sandbox Terminal", h1 { "Sandbox Terminal" } p { class: "muted", "A read-only virtual filesystem. No real commands, no AI tool execution." } Terminal { instance: 1 } }
                footer { class: "bottom-bar", span { "RUST + WASM / WEBGPU" } span { "YOUR DEVICE. YOUR CONTEXT." } }
            }
        }
    }
}
