import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState, OAUTH_STATE_COOKIE } from "@shared/const";

describe("Run Kurye OAuth state", () => {
  it("keeps redirect URI and nonce together", () => {
    const encoded = encodeOAuthState({ redirectUri: "https://runkurye.example/api/oauth/callback", nonce: "nonce-123" });
    expect(decodeOAuthState(encoded)).toEqual({ redirectUri: "https://runkurye.example/api/oauth/callback", nonce: "nonce-123" });
  });

  it("rejects malformed state without throwing", () => {
    expect(decodeOAuthState("not-valid-base64").nonce).toBeUndefined();
  });

  it("uses a host-only OAuth cookie name", () => {
    expect(OAUTH_STATE_COOKIE).toBe("__Host-oauth_state");
  });
});

// The browser-side startLogin implementation uses this same cookie contract.
// Callback failures clear it before redirecting back to the app so a retry can mint a fresh nonce.
