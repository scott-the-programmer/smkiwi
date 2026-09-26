mod about;
mod clock;
mod cloud;
mod model;
mod toys;

use about::About;
use clock::FractalClock;
use cloud::CloudInvoice;
use dioxus::prelude::*;
use model::{AppId, Desktop};
use toys::Terminal;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    let mut desktop = use_signal(Desktop::default);
    let mut menu = use_signal(|| false);
    let mut dark = use_signal(|| false);
    let mut clock = use_signal(time);
    use_future(move || async move {
        loop {
            gloo_timers::future::TimeoutFuture::new(1000).await;
            clock.set(time());
        }
    });
    let visible = desktop.read().visible();
    let count = visible.len();
    let rows = count.saturating_sub(1).max(1);
    let row_height = if count > 3 {
        "minmax(260px, 1fr)"
    } else {
        "minmax(0, 1fr)"
    };
    rsx! {
        main { class: if dark() { "desktop night" } else { "desktop" },
            onkeydown: move |e| { if e.key() == Key::Escape { menu.set(false); desktop.write().zoomed = None; } },
            header { class: "menubar",
                button { class: "brand", aria_label: "Open application menu", onclick: move |_| menu.toggle(), "●" }
                strong { "Scott" span { "OS" } }
                span { class: "menu-label", "Scott Murray's personal site" }
                div { class: "bar-right", span { class: "online", "●" } span { class: "menu-label", "Auckland, NZ" }
                    button { aria_label: "Toggle night mode", onclick: move |_| dark.toggle(), if dark() { "☀" } else { "☾" } }
                    time { "{clock}" }
                }
            }
            div { class: "workspace-bar",
                div { class: "workspace-name", span { "01" } " / personal" }
            }
            div { class: "tile-area tiles-{count}", style: "grid-template-rows:repeat({rows}, {row_height})",
                if count == 0 {
                    div { class: "empty-state", span { "●" } h1 { "No applications open" } p { "Open an application to add it to the workspace." }
                        button { class: "primary", onclick: move |_| { desktop.write().open(AppId::About); }, "Open About Me ↗" }
                    }
                }
                for window in desktop().windows.iter() {
                    {let id = window.id;
                    let app = window.app;
                    let position = visible.iter().position(|window_id| *window_id == id);
                    let index = position.unwrap_or(0);
                    let placement = if count <= 1 { format!("grid-column:{};grid-row:1", index + 1) }
                        else if index == 0 { format!("grid-column:1;grid-row:1 / span {}", count - 1) }
                        else { format!("grid-column:2;grid-row:{index}") };
                    let focused = desktop.read().focused == Some(id);
                    rsx! {
                        section { key: "{id:?}", class: if focused { "app-window focused" } else { "app-window" },
                            style: "{placement}", hidden: position.is_none(), aria_label: "{app.name()}", "data-window-id": "{id}",
                            onmousedown: move |_| desktop.write().focus(id),
                            onfocusin: move |_| desktop.write().focus(id),
                            header { class: "window-title",
                                span { class: "title-icon", "{app.icon()}" } strong { "{app.name()}" }
                                span { class: "tile-number", "#{id}" }
                                span { class: "window-controls",
                                    button { title: "Make master", aria_label: "Make master", onclick: move |_| desktop.write().promote(id), "⇤" }
                                    button { title: "Minimize", aria_label: "Minimize", onclick: move |_| desktop.write().minimize(id), "−" }
                                    button { title: "Zoom or restore", aria_label: "Zoom or restore", onclick: move |_| desktop.write().zoom(id), "□" }
                                    button { title: "Close", aria_label: "Close", class: "close", onclick: move |_| desktop.write().close(id), "×" }
                                }
                            }
                            div { class: "window-body",
                                match app {
                                    AppId::About => rsx! { About {} },
                                    AppId::Clock => rsx! { FractalClock { instance: id, active: position.is_some() } },
                                    AppId::Terminal => rsx! { Terminal { instance: id } },
                                    AppId::Cloud => rsx! { CloudInvoice { active: position.is_some(), instance: id } },
                                }
                            }
                            footer { class: "window-status", span { "●" } "{app.description()}" }
                        }
                    }}
                }
            }
            if menu() {
                div { class: "menu-backdrop", onclick: move |_| menu.set(false) }
                nav { class: "launcher", aria_label: "Application menu",
                    div { class: "launcher-heading", span { "●" } div { strong { "Scott OS" } p { "Open a new application window." } } }
                    p { class: "eyebrow", "APPLICATIONS" }
                    for app in AppId::ALL {
                        button { onclick: move |_| { desktop.write().open(app); menu.set(false); },
                            span { class: "app-icon", "{app.icon()}" }
                            div { strong { "{app.name()}" } small { "{app.description()}" } }
                            span { class: "launch-arrow", "↗" }
                        }
                    }
                    div { class: "launcher-footer", "TILING WINDOW MANAGER" }
                }
            }
            footer { class: "taskbar",
                button { class: "start", aria_label: "Applications", aria_expanded: menu(), onclick: move |_| menu.toggle(), "●" span { "Applications" } }
                div { class: "tasks",
                    for window in desktop().windows.iter() {
                        {let id = window.id; let app = window.app; rsx! {
                            button { key: "{id}", class: if visible.contains(&id) { "task running" } else { "task" }, aria_label: "Restore {app.name()} #{id}", onclick: move |_| desktop.write().restore(id),
                                span { "{app.icon()}" } span { class: "task-name", "{app.name()} #{id}" }
                            }
                        }}
                    }
                }
                span { class: "taskbar-note", "Built with Rust + Dioxus" }
                span { class: "system-version", "SCOTT OS / 02" }
            }
        }
    }
}

fn time() -> String {
    let date = js_sys::Date::new_0();
    format!("{:02}:{:02}", date.get_hours(), date.get_minutes())
}
