use dioxus::prelude::*;

// Bio, skills, employment, projects, and links restored from the original
// Hero.tsx, BubbleSkillGraph.tsx, Timeline.tsx, and Footer.tsx.
const SKILLS: [&str; 9] = [
    "Terraform",
    "AWS",
    "Pulumi",
    "Azure",
    ".NET",
    "Golang",
    "TypeScript",
    "Flutter",
    "Kafka",
];
const CAREER: [(&str, &str, &str); 8] = [
    ("TaxLab", "Jul 2025 to present", ""),
    ("Starshipit", "Jan 2024 to Jul 2025", ""),
    ("Lightspeed", "Oct 2022 to Jan 2024", ""),
    ("Serko", "Jun 2022 to Oct 2022", ""),
    ("Zip", "Nov 2019 to Jun 2022", ""),
    ("IQVIA", "Jan 2016 to Nov 2019", ""),
    ("DXC", "Apr 2015 to Dec 2015", ""),
    (
        "The University of Auckland",
        "Feb 2014 to Feb 2015",
        "Scholarship Student, Teaching Assistant",
    ),
];

#[component]
pub fn About() -> Element {
    rsx! {
        article { class: "about",
            div { class: "about-top", span { class: "pill", "HELLO, I'M SCOTT" } span { "36.85° S / 174.76° E" } }
            div { class: "about-heading", div { p { class: "eyebrow", "SCOTT MURRAY" } h1 { "Cloud" br {} em { "Whisperer." } } } img { class: "about-art", src: "/public/scott-avatar.png", alt: "Scott Murray" } }
            p { class: "intro", "Experienced " del { "clean code typer" } " " strong { "AI wielder" } " who resides in Auckland, New Zealand. Actively purchasing video games that I will never play." }
            p { class: "about-focus", "☁  I work with cloud infrastructure and deployment systems.  ↗" }
            nav { class: "social-links", aria_label: "Social links",
                a { href: "https://github.com/scott-the-programmer", target: "_blank", rel: "noopener noreferrer", "GitHub ↗" }
                a { href: "https://linkedin.com/in/scottalexandermurray", target: "_blank", rel: "noopener noreferrer", "LinkedIn ↗" }
                a { href: "https://twitter.com/ScottProgrammer", target: "_blank", rel: "noopener noreferrer", "X / Twitter ↗" }
                a { href: "https://instagram.com/shxppingtrxllxy", target: "_blank", rel: "noopener noreferrer", "Instagram ↗" }
            }
            section { class: "about-section",
                h2 { span { "01" } "Technologies" }
                div { class: "skills", for skill in SKILLS { span { "{skill}" } } }
            }
            section { class: "about-section",
                h2 { span { "02" } "Work history" }
                div { class: "career", for (company, dates, detail) in CAREER {
                    div { class: "career-row", div { h3 { "{company}" } if !detail.is_empty() { p { "{detail}" } } } span { "{dates}" } }
                } }
            }
            section { class: "about-section",
                h2 { span { "03" } "Projects and events" }
                div { class: "project", h3 { "terraform-provider-minikube" } p { "A Terraform provider for Minikube." } }
                div { class: "project", h3 { "backstage-plugin-spacelift" } p { "A Backstage plugin for Spacelift." } }
                div { class: "project", h3 { "meshed" } p { "A Kubernetes / Istio bootstrapper." } }
                dl { class: "highlights",
                    div { class: "highlight-row", dt { "Talk" } dd { "Presented at DevOps Auckland on Infrastructure as Code." } }
                    div { class: "highlight-row", dt { "Awards" } dd { "Zipster of the Year Award; second place at Zip hackathons in 2021 and 2022." } }
                    div { class: "highlight-row", dt { "Hackathon" } dd { "Lightspeed Hackathon 2023." } }
                    div { class: "highlight-row", dt { "Dogs" } dd { "Dog owner since 2022." } }
                }
            }
            div { class: "about-bottom", "AUCKLAND, NEW ZEALAND" span { "Fan of dogs and The Flash" } }
        }
    }
}
