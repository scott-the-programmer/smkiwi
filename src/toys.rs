use dioxus::prelude::*;

const COMMANDS: &[&str] = &[
    "about", "cat", "cd", "clear", "contact", "date", "echo", "fortune", "help", "history", "ls",
    "projects", "pwd", "skills", "uname", "whoami",
];

const HELP: &str = "help             List available commands\nabout            Show Scott's profile\nskills           Show technical skills\nprojects         Show featured projects\ncontact          Show contact links\nls [PATH]        List the virtual filesystem\ncd [PATH]        Change virtual directory\npwd               Print working directory\ncat FILE          Read a virtual file\nhistory           Show command history\ndate              Show local date and time\nwhoami            Print the current user\nuname             Print system information\nfortune           Print a message\necho [TEXT]       Print text\nclear             Clear terminal output\n\nKeyboard: ↑/↓ history · Tab completion";

const ABOUT: &str = "Scott Murray • Cloud Whisperer\nAuckland, New Zealand. Cloud infrastructure and deployment systems.\ngithub.com/scott-the-programmer";
const SKILLS: &str = "Cloud:          AWS · Azure · Kubernetes · Terraform\nEngineering:    Rust · Go · TypeScript · CI/CD\nInterests:      distributed systems · developer tooling · automation";
const PROJECTS: &str = "smkiwi/         This Rust + Dioxus desktop\nagent-work/     Experiments in practical AI-assisted development\ncloud-labs/     Infrastructure and deployment explorations";
const CONTACT: &str =
    "GitHub    https://github.com/scott-the-programmer\nLocation  Auckland, New Zealand";

#[derive(Debug, PartialEq, Eq)]
enum ShellAction {
    Output(String),
    ChangeDirectory(String, String),
    Clear,
}

#[component]
pub fn Terminal(instance: u64) -> Element {
    let mut input = use_signal(String::new);
    let mut cwd = use_signal(|| "~".to_string());
    let mut command_history = use_signal(Vec::<String>::new);
    let mut history_cursor = use_signal(|| None::<usize>);
    let mut output = use_signal(|| {
        vec![(
            String::new(),
            "Scott OS [version 0.3]\nA tiny shell, not a real system terminal.\nType help to see what's here."
                .to_string(),
        )]
    });

    rsx! {
        div { class: "terminal-app",
            div { class: "terminal-history", aria_live: "polite",
                for (command, result) in output().iter() {
                    div {
                        if !command.is_empty() {
                            p { class: "terminal-command", "guest@scott {command}" }
                        }
                        if !result.is_empty() { pre { "{result}" } }
                    }
                }
            }
            // Dioxus prevents native form navigation by default.
            form { onsubmit: move |_| {
                let command = input().trim().to_string();
                if command.is_empty() { return; }

                command_history.write().push(command.clone());
                let commands = command_history.read().clone();
                let prompt = format!("{} $ {}", cwd(), command);
                match execute(&command, &cwd(), &commands) {
                    ShellAction::Clear => output.write().clear(),
                    ShellAction::ChangeDirectory(next, message) => {
                        cwd.set(next);
                        push_output(&mut output, prompt, message);
                    }
                    ShellAction::Output(result) => push_output(&mut output, prompt, result),
                }
                input.set(String::new());
                history_cursor.set(None);
            },
                label { r#for: "terminal-input-{instance}", "guest@scott {cwd} $" }
                input {
                    id: "terminal-input-{instance}",
                    aria_label: "Terminal command",
                    autocomplete: "off",
                    spellcheck: "false",
                    value: "{input}",
                    oninput: move |e| { input.set(e.value()); history_cursor.set(None); },
                    onkeydown: move |e| match e.key() {
                        Key::ArrowUp => {
                            e.prevent_default();
                            let commands = command_history.read();
                            if !commands.is_empty() {
                                let index = history_cursor().map_or(commands.len() - 1, |i| i.saturating_sub(1));
                                input.set(commands[index].clone());
                                history_cursor.set(Some(index));
                            }
                        }
                        Key::ArrowDown => {
                            e.prevent_default();
                            let commands = command_history.read();
                            if let Some(index) = history_cursor() {
                                if index + 1 < commands.len() {
                                    input.set(commands[index + 1].clone());
                                    history_cursor.set(Some(index + 1));
                                } else {
                                    input.set(String::new());
                                    history_cursor.set(None);
                                }
                            }
                        }
                        Key::Tab => {
                            e.prevent_default();
                            if let Some(completed) = complete(&input()) { input.set(completed); }
                        }
                        _ => {}
                    }
                }
                button { r#type: "submit", title: "Run command", "↵" }
            }
            small { class: "terminal-hint", "↑↓ history  ·  Tab complete  ·  sandboxed" }
        }
    }
}

fn push_output(output: &mut Signal<Vec<(String, String)>>, command: String, result: String) {
    let mut entries = output.write();
    entries.push((command, result));
    if entries.len() > 100 {
        entries.remove(0);
    }
}

fn execute(command: &str, cwd: &str, history: &[String]) -> ShellAction {
    let mut words = command.split_whitespace();
    let name = words.next().unwrap_or_default();
    let args: Vec<_> = words.collect();
    let output = match name {
        "help" => HELP.to_string(),
        "about" => ABOUT.to_string(),
        "skills" => SKILLS.to_string(),
        "projects" => PROJECTS.to_string(),
        "contact" => CONTACT.to_string(),
        "pwd" => display_path(cwd),
        "whoami" => "guest".to_string(),
        "uname" => "Scott OS 0.3 wasm32 web".to_string(),
        "date" => String::from(js_sys::Date::new_0().to_string()),
        "fortune" => "Buy the game. You can leave it unplayed with the others.".to_string(),
        "history" => history
            .iter()
            .enumerate()
            .map(|(i, item)| format!("{:>3}  {item}", i + 1))
            .collect::<Vec<_>>()
            .join("\n"),
        "echo" => command
            .strip_prefix("echo")
            .unwrap_or_default()
            .trim_start()
            .to_string(),
        "clear" => return ShellAction::Clear,
        "cd" => return change_directory(args.first().copied().unwrap_or("~"), cwd),
        "ls" => list_directory(args.first().copied().unwrap_or(cwd), cwd),
        "cat" => {
            if let Some(path) = args.first() {
                read_file(path, cwd)
            } else {
                "cat: missing file operand".to_string()
            }
        }
        _ => format!(
            "Command not found: {name}\nTry help. This sandbox doesn't execute system commands."
        ),
    };
    ShellAction::Output(output)
}

fn complete(input: &str) -> Option<String> {
    if input.contains(char::is_whitespace) {
        return None;
    }
    let matches: Vec<_> = COMMANDS
        .iter()
        .filter(|command| command.starts_with(input))
        .collect();
    (matches.len() == 1).then(|| format!("{} ", matches[0]))
}

fn resolve_path(path: &str, cwd: &str) -> Option<&'static str> {
    match (cwd, path.trim_end_matches('/')) {
        (_, "" | "~" | "/" | "/home/guest") => Some("~"),
        ("~/projects", ".") => Some("~/projects"),
        (_, ".") => Some(if cwd == "~/projects" {
            "~/projects"
        } else {
            "~"
        }),
        (_, "..") => Some("~"),
        (_, "~/projects" | "/home/guest/projects") => Some("~/projects"),
        ("~", "projects" | "./projects") => Some("~/projects"),
        _ => None,
    }
}

fn change_directory(path: &str, cwd: &str) -> ShellAction {
    match resolve_path(path, cwd) {
        Some(next) => ShellAction::ChangeDirectory(next.to_string(), String::new()),
        None => ShellAction::Output(format!("cd: {path}: No such directory")),
    }
}

fn list_directory(path: &str, cwd: &str) -> String {
    match resolve_path(path, cwd) {
        Some("~") => "about.txt  contact.txt  projects/  skills.txt".to_string(),
        Some("~/projects") => "agent-work.md  cloud-labs.md  smkiwi.md".to_string(),
        _ => format!("ls: {path}: No such directory"),
    }
}

fn read_file(path: &str, cwd: &str) -> String {
    let name = path.rsplit('/').next().unwrap_or(path);
    match name {
        "about.txt" if cwd == "~" || path.contains('/') => ABOUT.to_string(),
        "skills.txt" if cwd == "~" || path.contains('/') => SKILLS.to_string(),
        "contact.txt" if cwd == "~" || path.contains('/') => CONTACT.to_string(),
        "smkiwi.md" if cwd == "~/projects" || path.contains("projects/") => {
            "# smkiwi\nA personal website presented as a tiling desktop, built with Rust and Dioxus."
                .to_string()
        }
        "agent-work.md" if cwd == "~/projects" || path.contains("projects/") => {
            "# agent-work\nExperiments in practical AI-assisted development.".to_string()
        }
        "cloud-labs.md" if cwd == "~/projects" || path.contains("projects/") => {
            "# cloud-labs\nInfrastructure and deployment explorations.".to_string()
        }
        _ => format!("cat: {path}: No such file"),
    }
}

fn display_path(cwd: &str) -> String {
    cwd.replacen('~', "/home/guest", 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(command: &str, cwd: &str) -> String {
        match execute(command, cwd, &[command.to_string()]) {
            ShellAction::Output(value) => value,
            action => panic!("expected output, got {action:?}"),
        }
    }

    #[test]
    fn supports_profile_and_shell_commands() {
        assert!(text("skills", "~").contains("Kubernetes"));
        assert_eq!(text("echo hello world", "~"), "hello world");
        assert_eq!(text("pwd", "~/projects"), "/home/guest/projects");
        assert!(text("history", "~").contains("1  history"));
    }

    #[test]
    fn navigates_the_virtual_filesystem() {
        assert_eq!(
            execute("cd projects", "~", &[]),
            ShellAction::ChangeDirectory("~/projects".to_string(), String::new())
        );
        assert!(text("ls", "~/projects").contains("smkiwi.md"));
        assert!(text("cat smkiwi.md", "~/projects").contains("Dioxus"));
        assert!(text("cd nowhere", "~").contains("No such directory"));
    }

    #[test]
    fn uniquely_completes_command_names() {
        assert_eq!(complete("who"), Some("whoami ".to_string()));
        assert_eq!(complete("c"), None);
        assert_eq!(complete("echo something"), None);
    }
}
