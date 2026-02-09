/**
 * Read an SSE response stream from a conversation endpoint.
 *
 * Server sends: data: {"chunk":"..."} per text delta, then data: {"done":true,"response":{...}} at the end.
 * This matches the pattern from /api/intake/stream.
 *
 * @param onMessage - called with progressively extracted "message" field from partial JSON
 */
export async function readSSEResponse<T>(
  response: Response,
  onMessage?: (partialMessage: string) => void,
  timeoutMs: number = 30_000,
): Promise<T> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  let timeoutId: ReturnType<typeof setTimeout>;
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => reader.cancel(), timeoutMs);
  };

  resetTimeout();

  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';
  let finalResponse: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    resetTimeout();
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.chunk) {
            accumulatedContent += parsed.chunk;
            if (onMessage) {
              // Extract "message" field from partial JSON for progressive display
              const messageMatch = accumulatedContent.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
              if (messageMatch) {
                const decoded = messageMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
                onMessage(decoded);
              }
            }
          }

          if (parsed.done && parsed.response) {
            finalResponse = parsed.response as T;
          }
        } catch (e) {
          // Ignore partial JSON parse errors from incomplete chunks
          if (e instanceof Error && e.message && !e.message.includes('Unexpected')) {
            if (!data.includes('"chunk"')) {
              throw e;
            }
          }
        }
      }
    }
  }

  clearTimeout(timeoutId!);

  if (!finalResponse) {
    throw new Error('No final response received from stream');
  }

  return finalResponse;
}
