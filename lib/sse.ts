/**
 * Incremental parser for the backend's Server-Sent Events stream.
 *
 * The backend emits events of the form `data: {"chunk": "..."}\n\n` and ends
 * with `data: [DONE]\n\n`. Network reads can split an event anywhere (even in
 * the middle of a line), so text is buffered until a full event (terminated by
 * a blank line) is available.
 */
export interface SSEParser {
  /** Feed decoded text exactly as it arrives from the network. */
  push(text: string): void;
  /** Flush any trailing event left in the buffer when the stream closes. */
  end(): void;
  /** True once the `[DONE]` sentinel has been received. */
  readonly done: boolean;
}

export function createSSEParser(onChunk: (chunk: string) => void): SSEParser {
  let buffer = "";
  let done = false;

  const handleEvent = (block: string) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");

    if (!data) return;
    if (data.trim() === "[DONE]") {
      done = true;
      return;
    }

    try {
      const parsed = JSON.parse(data);
      if (typeof parsed?.chunk === "string" && parsed.chunk) onChunk(parsed.chunk);
    } catch {
      // Ignore malformed events instead of aborting the whole stream.
    }
  };

  return {
    push(text: string) {
      if (done) return;
      buffer += text.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleEvent(block);
        if (done) {
          buffer = "";
          return;
        }
        boundary = buffer.indexOf("\n\n");
      }
    },
    end() {
      if (!done && buffer.trim()) handleEvent(buffer);
      buffer = "";
    },
    get done() {
      return done;
    },
  };
}
