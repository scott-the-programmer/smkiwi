#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AppId {
    About,
    Clock,
    Terminal,
    Cloud,
    ForwardBackward,
}
impl AppId {
    pub const ALL: [Self; 5] = [
        Self::About,
        Self::Clock,
        Self::Terminal,
        Self::Cloud,
        Self::ForwardBackward,
    ];
    pub fn name(self) -> &'static str {
        match self {
            Self::About => "About Me",
            Self::Clock => "Fractal Clock",
            Self::Terminal => "Terminal",
            Self::Cloud => "Cloud Invoice Simulator",
            Self::ForwardBackward => "Forward–Backward Lab",
        }
    }
    pub fn icon(self) -> &'static str {
        match self {
            Self::About => "●",
            Self::Clock => "◷",
            Self::Terminal => ">_",
            Self::Cloud => "☁",
            Self::ForwardBackward => "αβ",
        }
    }
    pub fn description(self) -> &'static str {
        match self {
            Self::About => "Scott Murray / Cloud Whisperer",
            Self::Clock => "Local time, recursively drawn",
            Self::Terminal => "A small, sandboxed shell",
            Self::Cloud => "Cloud traffic and fictional bills",
            Self::ForwardBackward => "Hidden Markov model visualizer",
        }
    }
}
pub type WindowId = u64;
#[derive(Clone)]
pub struct Window {
    pub id: WindowId,
    pub app: AppId,
    pub minimized: bool,
}
#[derive(Clone)]
pub struct Desktop {
    pub windows: Vec<Window>,
    pub focused: Option<WindowId>,
    pub zoomed: Option<WindowId>,
    next_id: WindowId,
}
impl Default for Desktop {
    fn default() -> Self {
        let mut desktop = Self {
            windows: vec![],
            focused: None,
            zoomed: None,
            next_id: 1,
        };
        for app in [AppId::About, AppId::Clock, AppId::Terminal] {
            desktop.open(app);
        }
        desktop.windows.reverse();
        desktop.focused = Some(1);
        desktop
    }
}
impl Desktop {
    pub fn open(&mut self, app: AppId) -> WindowId {
        let id = self.next_id;
        self.next_id += 1;
        self.windows.insert(
            0,
            Window {
                id,
                app,
                minimized: false,
            },
        );
        self.zoomed = None;
        self.focused = Some(id);
        id
    }
    pub fn restore(&mut self, id: WindowId) {
        if let Some(w) = self.windows.iter_mut().find(|w| w.id == id) {
            w.minimized = false;
            self.zoomed = None;
            self.focused = Some(id);
        }
    }
    pub fn focus(&mut self, id: WindowId) {
        self.focused = Some(id);
    }
    pub fn visible(&self) -> Vec<WindowId> {
        self.windows
            .iter()
            .filter(|w| !w.minimized && self.zoomed.is_none_or(|id| id == w.id))
            .map(|w| w.id)
            .collect()
    }
    pub fn close(&mut self, id: WindowId) {
        self.windows.retain(|w| w.id != id);
        self.reconcile(id);
    }
    pub fn minimize(&mut self, id: WindowId) {
        if let Some(w) = self.windows.iter_mut().find(|w| w.id == id) {
            w.minimized = true;
        }
        self.reconcile(id);
    }
    fn reconcile(&mut self, id: WindowId) {
        if self.zoomed == Some(id) {
            self.zoomed = None;
        }
        if self.focused == Some(id) {
            self.focused = self.visible().first().copied();
        }
    }
    pub fn zoom(&mut self, id: WindowId) {
        self.zoomed = if self.zoomed == Some(id) {
            None
        } else {
            Some(id)
        };
        self.focused = Some(id);
    }
    pub fn promote(&mut self, id: WindowId) {
        if let Some(i) = self.windows.iter().position(|w| w.id == id) {
            let w = self.windows.remove(i);
            self.windows.insert(0, w);
        }
        self.zoomed = None;
        self.focused = Some(id);
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Command {
    Launch(AppId),
    Switch(WindowId, AppId),
}
impl Command {
    pub fn title(self) -> String {
        match self {
            Self::Launch(app) => format!("Open {}", app.name()),
            Self::Switch(id, app) => format!("Switch to {} #{id}", app.name()),
        }
    }
    pub fn detail(self) -> &'static str {
        match self {
            Self::Launch(_) => "New window",
            Self::Switch(..) => "Focus existing window",
        }
    }
    pub fn icon(self) -> &'static str {
        match self {
            Self::Launch(app) | Self::Switch(_, app) => app.icon(),
        }
    }
    fn haystack(self) -> String {
        match self {
            Self::Launch(app) => format!("open launch new {} {}", app.name(), app.description()),
            Self::Switch(id, app) => format!(
                "switch focus restore window {} #{id} {}",
                app.name(),
                app.description()
            ),
        }
    }
}
impl Desktop {
    /// Commands for the ⌘K palette: existing windows first, then launchable apps.
    /// Every whitespace-separated word in `query` must appear (case-insensitively) in a command.
    pub fn commands(&self, query: &str) -> Vec<Command> {
        let words: Vec<String> = query
            .split_whitespace()
            .map(|word| word.to_lowercase())
            .collect();
        self.windows
            .iter()
            .map(|w| Command::Switch(w.id, w.app))
            .chain(AppId::ALL.into_iter().map(Command::Launch))
            .filter(|command| {
                let haystack = command.haystack().to_lowercase();
                words.iter().all(|word| haystack.contains(word.as_str()))
            })
            .collect()
    }
    pub fn run(&mut self, command: Command) {
        match command {
            Command::Launch(app) => {
                self.open(app);
            }
            Command::Switch(id, _) => self.restore(id),
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn default_tiles_all_apps() {
        assert_eq!(Desktop::default().visible(), vec![1, 2, 3]);
    }
    #[test]
    fn repeated_launches_create_independent_windows() {
        let mut d = Desktop::default();
        let id = d.open(AppId::Clock);
        assert_eq!(d.windows.len(), 4);
        assert_ne!(id, 2);
        d.minimize(2);
        assert!(d.visible().contains(&id));
        d.close(2);
        assert!(d.windows.iter().any(|w| w.id == id));
    }
    #[test]
    fn newly_opened_window_becomes_master() {
        let mut d = Desktop::default();
        let previous_master = d.visible()[0];
        let id = d.open(AppId::Cloud);
        let visible = d.visible();
        assert_eq!(visible[0], id);
        assert_eq!(visible[1], previous_master);
    }
    #[test]
    fn restore_does_not_create_a_window() {
        let mut d = Desktop::default();
        d.minimize(2);
        d.restore(2);
        assert_eq!(d.windows.len(), 3);
        assert_eq!(d.visible().len(), 3);
        assert_eq!(d.focused, Some(2));
    }
    #[test]
    fn promote_changes_master_without_losing_windows() {
        let mut d = Desktop::default();
        d.promote(3);
        assert_eq!(d.visible(), vec![3, 1, 2]);
    }
    #[test]
    fn zoom_restore_and_minimize_retile() {
        let mut d = Desktop::default();
        d.zoom(2);
        assert_eq!(d.visible(), vec![2]);
        d.zoom(2);
        assert_eq!(d.visible().len(), 3);
        d.zoom(2);
        d.minimize(2);
        assert_eq!(d.visible(), vec![1, 3]);
        assert_eq!(d.focused, Some(1));
    }
    #[test]
    fn close_last_and_reopen_does_not_reuse_ids() {
        let mut d = Desktop::default();
        for id in 1..=3 {
            d.close(id);
        }
        assert!(d.visible().is_empty());
        assert_eq!(d.focused, None);
        let id = d.open(AppId::About);
        assert_eq!(id, 4);
        assert_eq!(d.visible(), vec![id]);
    }

    #[test]
    fn palette_lists_windows_then_apps() {
        let d = Desktop::default();
        let commands = d.commands("");
        assert_eq!(commands.len(), 3 + AppId::ALL.len());
        assert_eq!(commands[0], Command::Switch(1, AppId::About));
        assert_eq!(commands[3], Command::Launch(AppId::About));
    }
    #[test]
    fn palette_filters_case_insensitively_by_every_word() {
        let d = Desktop::default();
        assert_eq!(
            d.commands("CLOCK open"),
            vec![Command::Launch(AppId::Clock)]
        );
        assert_eq!(
            d.commands("switch term"),
            vec![Command::Switch(3, AppId::Terminal)]
        );
        assert!(d.commands("nonexistent").is_empty());
    }
    #[test]
    fn running_commands_opens_or_restores() {
        let mut d = Desktop::default();
        d.minimize(2);
        d.run(Command::Switch(2, AppId::Clock));
        assert_eq!(d.windows.len(), 3);
        assert_eq!(d.focused, Some(2));
        d.run(Command::Launch(AppId::Cloud));
        assert_eq!(d.windows.len(), 4);
        assert_eq!(d.visible()[0], 4);
    }
}
