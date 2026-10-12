use dioxus::prelude::*;

#[component]
pub fn Portfolio() -> Element {
    rsx! {
        a { class: "skip-link", href: "#content", "Skip to content" }
        header { class: "site-header wrap",
            a { class: "wordmark", href: "#", aria_label: "Scott Murray home", span { class: "monogram", "sm" } "Scott Murray" }
            nav { aria_label: "Main navigation",
                a { href: "#work", "Projects" }
                a { href: "#contributions", "Contributions" }
                a { href: "#about", "About" }
                a { class: "contact-link", href: "mailto:scott@murray.kiwi", "Get in touch" span { aria_hidden: "true", "↗" } }
            }
        }
        main { id: "content", tabindex: "-1",
            onmounted: move |_| {
                // The browser may resolve the initial fragment before WASM creates its target.
                let _ = document::eval(r#"(async () => {
                    await document.fonts.ready;
                    requestAnimationFrame(() => {
                        const target = document.getElementById(location.hash.slice(1));
                        if (target) target.scrollIntoView({ behavior: 'instant' });
                    });
                })();"#);
            },
            section { class: "hero wrap", aria_label: "Introduction",
                div { class: "hero-copy",
                    p { class: "location", span { class: "location-dot" } "Auckland, New Zealand" }
                    h1 { "Software engineer.\nTinkerer. Human." }
                    p { class: "hero-description", "I'm Scott. I work on cloud infrastructure and developer tooling, build things that solve problems I run into, and contribute to open-source software." }
                    div { class: "hero-actions",
                        a { class: "button primary", href: "#work", "Explore my work" span { aria_hidden: "true", "↓" } }
                        a { class: "text-link", href: "https://github.com/scott-the-programmer", "GitHub profile" span { aria_hidden: "true", "↗" } }
                    }
                }
                div { class: "hero-profile",
                    img { src: "/public/scott-avatar.png", alt: "Scott Murray", width: "360", height: "360" }
                }
            }
            section { id: "work", class: "work-section wrap",
                div { class: "section-heading", h2 { "Projects I've built" } p { "Infrastructure, developer tools, and a browser extension." } }
                div { class: "project-list",
                    ProjectRow { name: "VS Code Dev Containers for herdr", description: "A plugin that connects VS Code devcontainers and the coding agents inside them to herdr.", href: "https://github.com/scott-the-programmer/vscode-devcontainers-herdr", detail: "Developer tooling" }
                    ProjectRow { name: "Minikube Terraform provider", description: "Manage local Kubernetes clusters with Terraform and connect them to the rest of your infrastructure configuration.", href: "https://github.com/scott-the-programmer/terraform-provider-minikube", detail: "Infrastructure as code" }
                    ProjectRow { name: "Teams emoji uploader", description: "A Chrome extension for uploading multiple custom emoji files to Microsoft Teams in the browser.", href: "https://github.com/scott-the-programmer/teams-emoji-upload-extension", detail: "Browser extension" }
                }
                a { class: "all-projects text-link", href: "https://github.com/scott-the-programmer?tab=repositories", "All public repositories" span { aria_hidden: "true", "↗" } }
            }
            section { id: "contributions", class: "contributions-section",
                div { class: "wrap",
                    div { class: "section-heading", h2 { "Open-source contributions" } p { "Some of the projects I've contributed to." } }
                    div { class: "contribution-list",
                        ContributionLink { name: "PostHog", href: "https://github.com/PostHog/posthog-dotnet" }
                        ContributionLink { name: "Azure SDKs", href: "https://github.com/Azure/go-autorest" }
                        ContributionLink { name: ".NET", href: "https://github.com/dotnet/sdk" }
                        ContributionLink { name: "Pulumi", href: "https://github.com/pulumi/pulumi" }
                        ContributionLink { name: "Azure's Terraform provider", href: "https://github.com/hashicorp/terraform-provider-azurerm" }
                    }
                    a { class: "all-projects text-link", href: "https://github.com/search?q=is%3Apr+author%3Ascott-the-programmer+-user%3Ascott-the-programmer&type=pullrequests", "More contributions on GitHub" span { aria_hidden: "true", "↗" } }
                }
            }
            section { id: "about", class: "about-section wrap",
                aside { class: "about-aside", h2 { "A bit about me" } p { "General purpose tech guy,\nfrom Auckland, New Zealand." } }
                div { class: "about-copy",
                    p { "I enjoy working across infrastructure and the tools people use to build software. My public projects cover local infrastructure, development containers, and browser extensions." }
                    p { "Outside of software: long periods of dog walks and nature, short periods of friend slop games." }
                    div { class: "about-links", a { class: "text-link", href: "https://linkedin.com/in/scottalexandermurray", "LinkedIn ↗" } a { class: "text-link", href: "https://github.com/scott-the-programmer", "GitHub ↗" } }
                }
            }
            section { class: "contact-section wrap", h2 { "Have a problem worth working on?" } a { href: "mailto:scott@murray.kiwi", "scott@murray.kiwi" span { aria_hidden: "true", "↗" } } }
        }
    }
}

#[component]
fn ProjectRow(
    name: &'static str,
    description: &'static str,
    href: &'static str,
    detail: &'static str,
) -> Element {
    rsx! {
        article { class: "project-row",
            div { h3 { a { href, "{name}" span { aria_hidden: "true", "↗" } } } span { class: "project-detail", "{detail}" } }
            p { "{description}" }
        }
    }
}

#[component]
fn ContributionLink(name: &'static str, href: &'static str) -> Element {
    rsx! {
        a { class: "contribution-link", href, "{name}" span { aria_hidden: "true", "↗" } }
    }
}
