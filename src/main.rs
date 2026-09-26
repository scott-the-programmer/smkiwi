mod about;
mod clock;
mod cloud;
mod forward_backward;
mod model;
mod toys;

use about::About;
use clock::FractalClock;
use cloud::CloudInvoice;
use dioxus::prelude::*;
use forward_backward::ForwardBackward;
use model::{AppId, Command, Desktop};
use toys::Terminal;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    let mut desktop = use_signal(Desktop::default);
    let mut menu = use_signal(|| false);
    let mut dark = use_signal(prefers_dark);
    let mut clock = use_signal(time);
    let mut palette = use_signal(|| false);
    let mut query = use_signal(String::new);
    let mut selected = use_signal(|| 0usize);
    use_future(move || async move {
        // Global ⌘K / Ctrl+K listener: DOM keydown events only reach `main` while focus is inside it.
        let mut listener = document::eval(
            r#"addEventListener('keydown', event => {
                if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
                    event.preventDefault();
                    dioxus.send(true);
                }
            });"#,
        );
        while listener.recv::<bool>().await.is_ok() {
            query.set(String::new());
            selected.set(0);
            menu.set(false);
            palette.toggle();
        }
    });
    use_future(move || async move {
        // Follow the OS colour scheme while the page is open; the moon button still overrides it.
        let mut scheme = document::eval(
            r#"matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => dioxus.send(event.matches));"#,
        );
        while let Ok(prefers) = scheme.recv::<bool>().await {
            dark.set(prefers);
        }
    });
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
    // Precomputed per-window data so the `for` body is a single keyed `section`; Dioxus only
    // honours `key` on the direct child of the loop, and new windows are inserted at the front.
    let tiles: Vec<(model::WindowId, AppId, Option<usize>, String, bool)> = desktop
        .read()
        .windows
        .iter()
        .map(|window| {
            let position = visible.iter().position(|window_id| *window_id == window.id);
            let index = position.unwrap_or(0);
            let placement = if count <= 1 {
                format!("grid-column:{};grid-row:1", index + 1)
            } else if index == 0 {
                format!("grid-column:1;grid-row:1 / span {}", count - 1)
            } else {
                format!("grid-column:2;grid-row:{index}")
            };
            let focused = desktop.read().focused == Some(window.id);
            (window.id, window.app, position, placement, focused)
        })
        .collect();
    rsx! {
        main { class: if dark() { "desktop night" } else { "desktop" },
            onkeydown: move |e| { if e.key() == Key::Escape {
                menu.set(false);
                palette.set(false);
                if desktop.read().zoomed.is_some() {
                    begin_tile_transition();
                    desktop.write().zoomed = None;
                }
            } },
            header { class: "menubar",
                button { class: "brand", aria_label: "Open application menu", onclick: move |_| menu.toggle(), "●" }
                strong { "Scott" span { "OS" } }
                span { class: "menu-label", "Scott Murray's personal site" }
                button { class: "palette-hint", aria_label: "Open command palette", onclick: move |_| { query.set(String::new()); selected.set(0); menu.set(false); palette.set(true); }, kbd { "⌘K" } }
                div { class: "bar-right", span { class: "online", "●" } span { class: "menu-label", "Auckland, NZ" }
                    button { aria_label: "Toggle night mode", onclick: move |_| dark.toggle(), if dark() { "☀" } else { "☾" } }
                    time { "{clock}" }
                }
            }
            div { class: "workspace-bar",
                div { class: "workspace-name", span { "01" } " / personal" }
            }
            div { class: if count > 3 { "tile-area tiles-{count} stacked" } else { "tile-area tiles-{count}" }, style: "grid-template-rows:repeat({rows}, {row_height})",
                if count == 0 {
                    div { class: "empty-state", span { "●" } h1 { "No applications open" } p { "Open an application to add it to the workspace." }
                        button { class: "primary", onclick: move |_| { begin_tile_transition(); desktop.write().open(AppId::About); }, "Open About Me ↗" }
                    }
                }
                for (id, app, position, placement, focused) in tiles.iter().cloned() {
                    section { key: "{id}",
                        class: match (position, focused) {
                            (Some(0), true) => "app-window master focused",
                            (Some(0), false) => "app-window master",
                            (_, true) => "app-window focused",
                            (_, false) => "app-window",
                        },
                        style: "{placement}", hidden: position.is_none(), aria_label: "{app.name()}", "data-window-id": "{id}",
                        onmousedown: move |_| desktop.write().focus(id),
                        onfocusin: move |_| desktop.write().focus(id),
                        header { class: "window-title",
                            span { class: "title-icon", "{app.icon()}" } strong { "{app.name()}" }
                            span { class: "tile-number", "#{id}" }
                            span { class: "window-controls",
                                button { title: "Make master", aria_label: "Make master", onclick: move |_| { begin_tile_transition(); desktop.write().promote(id); }, "⇤" }
                                button { title: "Minimize", aria_label: "Minimize", onclick: move |_| { begin_tile_transition(); desktop.write().minimize(id); }, "−" }
                                button { title: "Zoom or restore", aria_label: "Zoom or restore", onclick: move |_| { begin_tile_transition(); desktop.write().zoom(id); }, "□" }
                                button { title: "Close", aria_label: "Close", class: "close", onclick: move |_| { begin_tile_transition(); desktop.write().close(id); }, "×" }
                            }
                        }
                        div { class: "window-body",
                            match app {
                                AppId::About => rsx! { About {} },
                                AppId::Clock => rsx! { FractalClock { instance: id, active: position.is_some() } },
                                AppId::Terminal => rsx! { Terminal { instance: id } },
                                AppId::Cloud => rsx! { CloudInvoice { active: position.is_some(), instance: id } },
                                AppId::ForwardBackward => rsx! { ForwardBackward { instance: id } },
                            }
                        }
                        footer { class: "window-status", span { "●" } "{app.description()}" }
                    }
                }
            }
            if menu() {
                div { class: "menu-backdrop", onclick: move |_| menu.set(false) }
                nav { class: "launcher", aria_label: "Application menu",
                    div { class: "launcher-heading", span { "●" } div { strong { "Scott OS" } p { "Open a new application window." } } }
                    p { class: "eyebrow", "APPLICATIONS" }
                    for app in AppId::ALL {
                        button { onclick: move |_| { begin_tile_transition(); desktop.write().open(app); menu.set(false); },
                            span { class: "app-icon", "{app.icon()}" }
                            div { strong { "{app.name()}" } small { "{app.description()}" } }
                            span { class: "launch-arrow", "↗" }
                        }
                    }
                    div { class: "launcher-footer", "TILING WINDOW MANAGER  ·  ⌘K / CTRL+K COMMAND PALETTE" }
                }
            }
            if palette() {
                {let commands = desktop.read().commands(&query());
                let current = selected().min(commands.len().saturating_sub(1));
                rsx! {
                div { class: "palette-backdrop", onclick: move |_| palette.set(false) }
                div { class: "palette", role: "dialog", aria_label: "Command palette",
                    input {
                        class: "palette-input",
                        r#type: "text",
                        aria_label: "Search commands",
                        placeholder: "Open or switch to an application…",
                        onmounted: move |e| async move { let _ = e.set_focus(true).await; },
                        autocomplete: "off",
                        spellcheck: "false",
                        value: "{query}",
                        oninput: move |e| { query.set(e.value()); selected.set(0); },
                        onkeydown: move |e| match e.key() {
                            Key::ArrowDown => { e.prevent_default(); if !commands.is_empty() { selected.set((current + 1) % commands.len()); } }
                            Key::ArrowUp => { e.prevent_default(); if !commands.is_empty() { selected.set((current + commands.len() - 1) % commands.len()); } }
                            Key::Enter => { e.prevent_default(); if let Some(command) = commands.get(current) { run_command(desktop, palette, *command); } }
                            _ => {}
                        }
                    }
                    if commands.is_empty() {
                        p { class: "palette-empty", "No matching commands." }
                    }
                    for (index, command) in commands.iter().copied().enumerate() {
                        button { key: "{command:?}", class: if index == current { "palette-item selected" } else { "palette-item" },
                            onmouseenter: move |_| selected.set(index), onclick: move |_| run_command(desktop, palette, command),
                            span { class: "app-icon", "{command.icon()}" }
                            div { strong { "{command.title()}" } small { "{command.detail()}" } }
                            if index == current { kbd { "↵" } }
                        }
                    }
                    div { class: "palette-footer", "↑↓ navigate  ·  ↵ run  ·  esc close" }
                }
                }}
            }
            footer { class: "taskbar",
                button { class: "start", aria_label: "Applications", aria_expanded: menu(), onclick: move |_| menu.toggle(), "●" span { "Applications" } }
                div { class: "tasks",
                    for window in desktop().windows.iter() {
                        {let id = window.id; let app = window.app; rsx! {
                            button { key: "{id}", class: if visible.contains(&id) { "task running" } else { "task" }, aria_label: "Restore {app.name()} #{id}", onclick: move |_| { begin_tile_transition(); desktop.write().restore(id); },
                                span { "{app.icon()}" } span { class: "task-name", "{app.name()} #{id}" }
                            }
                        }}
                    }
                }
            }
        }
    }
}

fn run_command(mut desktop: Signal<Desktop>, mut palette: Signal<bool>, command: Command) {
    begin_tile_transition();
    desktop.write().run(command);
    palette.set(false);
}

fn begin_tile_transition() {
    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::{JsCast, JsValue};

        let global = js_sys::global();
        if let Ok(value) = js_sys::Reflect::get(&global, &JsValue::from_str("beginTileTransition"))
        {
            if let Some(function) = value.dyn_ref::<js_sys::Function>() {
                let _ = function.call0(&global);
            }
        }
    }
}

/// Start in night mode when the OS asks for a dark colour scheme; the moon button still overrides it.
fn prefers_dark() -> bool {
    js_sys::eval("matchMedia('(prefers-color-scheme: dark)').matches")
        .ok()
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
}

fn time() -> String {
    let date = js_sys::Date::new_0();
    format!("{:02}:{:02}", date.get_hours(), date.get_minutes())
}
