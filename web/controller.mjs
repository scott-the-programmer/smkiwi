export class Harness {
  constructor(factory, change = () => {}) {
    this.factory = factory;
    this.change = change;
    this.state = "idle";
    this.messages = [];
    this.partial = "";
    this.detail = "No model loaded";
    this.epoch = 0;
  }
  notify() {
    this.change(this);
  }
  async connect(kind, system) {
    if (this.state === "loading" || this.state === "streaming") return;
    this.disconnect();
    const epoch = this.epoch;
    this.current = null;
    this.partial = "";
    this.system = system.trim();
    this.kind = kind;
    this.abort = new AbortController();
    const adapter = this.factory(kind);
    this.adapter = adapter;
    this.state = "loading";
    this.detail = "Preparing local runtime…";
    this.notify();
    try {
      await adapter.connect({
        system: this.system,
        messages: this.messages,
        signal: this.abort.signal,
        progress: (text) => {
          if (epoch === this.epoch) {
            this.detail = text;
            this.notify();
          }
        },
      });
      if (epoch !== this.epoch) {
        adapter.dispose();
        return;
      }
      this.state = "ready";
      this.detail = "Local model ready";
    } catch (error) {
      if (epoch !== this.epoch) return;
      adapter.dispose();
      this.adapter = null;
      this.state = "error";
      this.detail = error.message || String(error);
    }
    this.notify();
  }
  async run(prompt) {
    if (this.state !== "ready" || !prompt.trim()) return false;
    if (prompt.length > 8000 || this.messages.length >= 24) {
      this.detail =
        "Session limit reached. Use a shorter prompt (8,000 characters max) or start a new session (12 turns max).";
      this.notify();
      return false;
    }
    const epoch = this.epoch;
    const user = { role: "user", content: prompt.trim() };
    this.current = user;
    this.partial = "";
    this.state = "streaming";
    this.detail = "Generating on your device…";
    this.started = performance.now();
    this.notify();
    try {
      const messages = [
        { role: "system", content: this.system },
        ...this.messages,
        user,
      ];
      for await (const delta of this.adapter.stream(
        messages,
        this.abort.signal,
      )) {
        if (epoch !== this.epoch) return true;
        this.partial += delta;
        if (this.partial.length > 64000)
          throw new Error(
            "Response limit reached. Start a new session with a shorter request.",
          );
        this.notify();
      }
      if (epoch !== this.epoch) return true;
      if (!this.partial.trim())
        throw new Error("The model returned no text. Try a different prompt.");
      this.messages.push(user, { role: "assistant", content: this.partial });
      this.elapsed = (performance.now() - this.started) / 1000;
      this.current = null;
      this.partial = "";
      this.state = "ready";
      this.detail = "Run complete · local inference";
    } catch (error) {
      if (epoch !== this.epoch) return true;
      this.disconnect();
      this.state = "error";
      this.detail =
        (error.message || String(error)) +
        " Reconnect to retry; incomplete turns are not sent again.";
    }
    this.notify();
    return true;
  }
  disconnect() {
    this.epoch++;
    this.abort?.abort();
    this.adapter?.dispose();
    this.adapter = null;
  }
  stop() {
    this.disconnect();
    this.state = "idle";
    this.detail =
      "Stopped. Reconnect to continue; incomplete turns are not sent again.";
    this.notify();
  }
  reset() {
    this.disconnect();
    this.messages = [];
    this.current = null;
    this.partial = "";
    this.elapsed = null;
    this.state = "idle";
    this.detail = "New session · no model loaded";
    this.notify();
  }
}
