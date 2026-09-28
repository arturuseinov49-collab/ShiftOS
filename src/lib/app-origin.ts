/** A configured origin avoids trusting forwarded headers for auth redirects and CSRF. */
export function appOrigin(requestUrl: string): string {
  const configured = process.env.APP_ORIGIN;
  if (!configured) return new URL(requestUrl).origin;
  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  )
    throw new Error(
      "APP_ORIGIN must be a canonical HTTPS origin in production",
    );
  return url.origin;
}
