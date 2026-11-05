/**
 * Extra request fields for embedding calls.
 * EMBEDDING_PROVIDER_IGNORE is a comma-separated list of OpenRouter providers to skip.
 */
export function embeddingRequestOptions(): Record<string, unknown> {
  const ignore = (process.env.EMBEDDING_PROVIDER_IGNORE || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return ignore.length > 0 ? { provider: { ignore } } : {};
}
