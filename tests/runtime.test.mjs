import test from "node:test";
import assert from "node:assert/strict";
import { Harness } from "../web/controller.mjs";
test("user-triggered connection and streamed completion", async () => {
  const calls = [];
  const adapter = {
    async connect(o) {
      calls.push(o);
    },
    async *stream(m) {
      calls.push(m);
      yield "Hello";
      yield " world";
    },
    dispose() {},
  };
  const h = new Harness(() => adapter);
  assert.equal(calls.length, 0);
  assert.equal(h.state, "idle");
  await h.connect("native", "Be concise.");
  assert.equal(h.state, "ready");
  await h.run("Hi");
  assert.equal(h.messages[1].content, "Hello world");
  assert.equal(calls[0].system, "Be concise.");
  assert.equal(calls[1][0].role, "system");
});

// Test fixtures replace the device runtime, never the controller under test.
const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
test("late initialization after reset cannot revive a session", async () => {
  let release;
  let disposed = 0;
  const h = new Harness(() => ({
    connect: () =>
      new Promise((r) => {
        release = r;
      }),
    dispose() {
      disposed++;
    },
  }));
  const pending = h.connect("native", "system");
  assert.equal(h.state, "loading");
  h.reset();
  release();
  await pending;
  assert.equal(h.state, "idle");
  assert.equal(h.messages.length, 0);
  assert(disposed >= 1);
});
test("cancel invalidates late stream chunks and incomplete history", async () => {
  let release;
  let disposed = false;
  const h = new Harness(() => ({
    async connect() {},
    async *stream() {
      yield "partial";
      await new Promise((r) => {
        release = r;
      });
      yield "late";
    },
    dispose() {
      disposed = true;
    },
  }));
  await h.connect("native", "system");
  const pending = h.run("hi");
  await wait();
  assert.equal(h.partial, "partial");
  h.stop();
  release();
  await pending;
  assert.equal(h.partial, "partial");
  assert.equal(h.state, "idle");
  assert.equal(h.messages.length, 0);
  assert(disposed);
  h.reset();
  assert.equal(h.partial, "");
  assert.equal(h.current, null);
});
test("runtime failure is surfaced without committing incomplete history", async () => {
  const h = new Harness(() => ({
    async connect() {},
    async *stream() {
      throw new Error("GPU lost");
    },
    dispose() {},
  }));
  await h.connect("webllm", "system");
  await h.run("hi");
  assert.equal(h.state, "error");
  assert.match(h.detail, /GPU lost/);
  assert.equal(h.messages.length, 0);
});
test("blank prompts and concurrent runs are rejected", async () => {
  let release;
  const h = new Harness(() => ({
    async connect() {},
    async *stream() {
      await new Promise((r) => {
        release = r;
      });
      yield "ok";
    },
    dispose() {},
  }));
  assert.equal(await h.run("hi"), false);
  await h.connect("native", "system");
  assert.equal(await h.run(" "), false);
  const p = h.run("hello");
  await wait();
  assert.equal(await h.run("duplicate"), false);
  release();
  await p;
  assert.equal(h.messages.length, 2);
});
test("loading failure is actionable and an oversized input stays local", async () => {
  const h = new Harness(() => ({
    async connect() {
      throw new Error("unavailable");
    },
    dispose() {},
  }));
  await h.connect("native", "system");
  assert.equal(h.state, "error");
  assert.match(h.detail, /unavailable/);
  h.factory = () => ({ async connect() {}, dispose() {} });
  await h.connect("native", "system");
  assert.equal(await h.run("x".repeat(8001)), false);
  assert.equal(h.state, "ready");
  assert.match(h.detail, /shorter/);
});
