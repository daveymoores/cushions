/** Every outbound call goes through here so none can hang a run. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const TIMEOUT_MS = {
  shopify: 20_000,
  resend: 15_000,
  site: 15_000,
  indexnow: 20_000,
} as const;

export async function fetchWithTimeout(
  fetcher: FetchLike,
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  try {
    return await fetcher(url, {...init, signal: AbortSignal.timeout(ms)});
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new Error(`${init.method ?? 'GET'} ${new URL(url).host} timed out after ${ms} ms`);
    }
    throw error;
  }
}
