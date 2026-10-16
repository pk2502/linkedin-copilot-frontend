import { describe, expect, it } from "vitest";
import { createSSEParser } from "@/lib/sse";

const event = (chunk: string) => `data: ${JSON.stringify({ chunk })}\n\n`;

function collect() {
  const chunks: string[] = [];
  const parser = createSSEParser((chunk) => chunks.push(chunk));
  return { chunks, parser };
}

describe("createSSEParser", () => {
  it("parses complete events and the DONE sentinel", () => {
    const { chunks, parser } = collect();

    parser.push(event("Hi ") + event("Priya") + "data: [DONE]\n\n");

    expect(chunks).toEqual(["Hi ", "Priya"]);
    expect(parser.done).toBe(true);
  });

  it("reassembles an event split mid-line across network reads", () => {
    const { chunks, parser } = collect();
    const text = event("Hello, world") + "data: [DONE]\n\n";

    for (const piece of [text.slice(0, 7), text.slice(7, 19), text.slice(19, 30), text.slice(30)]) {
      parser.push(piece);
    }

    expect(chunks).toEqual(["Hello, world"]);
    expect(parser.done).toBe(true);
  });

  it("handles every possible single-character split position", () => {
    const text = event("A") + event("B") + "data: [DONE]\n\n";
    for (let i = 1; i < text.length; i++) {
      const { chunks, parser } = collect();
      parser.push(text.slice(0, i));
      parser.push(text.slice(i));
      expect(chunks, `split at ${i}`).toEqual(["A", "B"]);
      expect(parser.done).toBe(true);
    }
  });

  it("keeps newlines and quotes inside chunks", () => {
    const { chunks, parser } = collect();

    parser.push(event('Line one\nLine "two"'));

    expect(chunks).toEqual(['Line one\nLine "two"']);
  });

  it("ignores malformed JSON and events without data", () => {
    const { chunks, parser } = collect();

    parser.push("data: {not json\n\n: keep-alive comment\n\n" + event("ok"));

    expect(chunks).toEqual(["ok"]);
    expect(parser.done).toBe(false);
  });

  it("accepts CRLF line endings", () => {
    const { chunks, parser } = collect();

    parser.push('data: {"chunk": "crlf"}\r\n\r\ndata: [DONE]\r\n\r\n');

    expect(chunks).toEqual(["crlf"]);
    expect(parser.done).toBe(true);
  });

  it("ignores anything after DONE", () => {
    const { chunks, parser } = collect();

    parser.push("data: [DONE]\n\n" + event("late"));

    expect(chunks).toEqual([]);
    expect(parser.done).toBe(true);
  });

  it("flushes a trailing event without a blank line on end()", () => {
    const { chunks, parser } = collect();

    parser.push('data: {"chunk": "tail"}');
    expect(chunks).toEqual([]);
    parser.end();

    expect(chunks).toEqual(["tail"]);
  });
});
