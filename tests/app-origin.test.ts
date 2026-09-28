import { afterEach, describe, expect, it, vi } from "vitest";
import { appOrigin } from "../src/lib/app-origin";

afterEach(() => vi.unstubAllEnvs());
describe("canonical application origin", () => {
  it("uses the development request origin without configuration", () => {
    vi.stubEnv("APP_ORIGIN", "");
    expect(appOrigin("http://127.0.0.1:3000/auth/callback?code=x")).toBe(
      "http://127.0.0.1:3000",
    );
  });
  it("ignores an untrusted request host when the deployment origin is set", () => {
    vi.stubEnv("APP_ORIGIN", "https://shiftos.example.com");
    expect(appOrigin("http://attacker.example/auth/callback")).toBe(
      "https://shiftos.example.com",
    );
  });
  it.each([
    "http://shiftos.example.com",
    "https://user:pass@example.com",
    "https://example.com/path",
    "https://example.com?redirect=x",
    "https://example.com#x",
    "file:///tmp/app",
  ])("rejects unsafe production configuration: %s", (value) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ORIGIN", value);
    expect(() => appOrigin("http://127.0.0.1:3000")).toThrow();
  });
});
