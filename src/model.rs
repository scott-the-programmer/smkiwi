#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AppId {
    About,
    Clock,
    Terminal,
    Cloud,
}
impl AppId {
    pub const ALL: [Self; 4] = [Self::About, Self::Clock, Self::Terminal, Self::Cloud];
    pub fn name(self) -> &'static str {
        match self {
            Self::About => "About Me",
            Self::Clock => "Fractal Clock",
            Self::Terminal => "Terminal",
            Self::Cloud => "Cloud Invoice Simulator",
        }
    }
    pub fn icon(self) -> &'static str {
        match self {
            Self::About => "●",
            Self::Clock => "◷",
            Self::Terminal => ">_",
            Self::Cloud => "☁",
        }
    }
    pub fn description(self) -> &'static str {
        match self {
            Self::About => "Scott Murray / Cloud Whisperer",
            Self::Clock => "Local time, recursively drawn",
            Self::Terminal => "A small, sandboxed shell",
            Self::Cloud => "Cloud traffic and fictional bills",
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
        desktop.focused = Some(1);
        desktop
    }
}
impl Desktop {
    pub fn open(&mut self, app: AppId) -> WindowId {
        let id = self.next_id;
        self.next_id += 1;
        self.windows.push(Window {
            id,
            app,
            minimized: false,
        });
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
}
