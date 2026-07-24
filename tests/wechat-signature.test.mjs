import assert from "node:assert/strict";
import test from "node:test";

import {
  createWechatSignature,
  normalizeWechatPageUrl,
  wechatCacheExpiry,
} from "../lib/wechat-signature.ts";
import { isWechatBrowser } from "../lib/wechat-client.ts";
import { GET as getWechatSignature } from "../app/api/wechat/signature/route.ts";

test("creates a stable WeChat JS-SDK SHA-1 signature", () => {
  assert.equal(
    createWechatSignature(
      "sM4AOVdWfPE4DxkXGEs8VMKk4sK7q4om4iG8kHTYxI3wM8oM9lP7K4xY3l9wZ1k5",
      "http://mp.weixin.qq.com?params=value",
      1414587457,
      "Wm3WZYTPz0wzccnW",
    ),
    "dfc6c735394b906ae6fc977b42309d93289e2921",
  );
});

test("normalizes only same-origin HTTPS pages and removes the hash", () => {
  assert.equal(
    normalizeWechatPageUrl("https://same.example/path?a=1#section", "https://same.example/api/wechat/signature"),
    "https://same.example/path?a=1",
  );
  assert.throws(
    () => normalizeWechatPageUrl("http://same.example/path", "https://same.example/api/wechat/signature"),
    /HTTPS/,
  );
  assert.throws(
    () => normalizeWechatPageUrl("https://other.example/path", "https://same.example/api/wechat/signature"),
    /当前站点/,
  );
});

test("expires WeChat credentials five minutes early with a minimum safe lifetime", () => {
  assert.equal(wechatCacheExpiry(1_000, 7200), 6_901_000);
  assert.equal(wechatCacheExpiry(1_000, 120), 31_000);
});

test("detects WeChat without classifying normal mobile browsers", () => {
  assert.equal(isWechatBrowser("Mozilla/5.0 MicroMessenger/8.0.50"), true);
  assert.equal(isWechatBrowser("Mozilla/5.0 Mobile Safari/605.1.15"), false);
});

test("returns a clean disabled response when WeChat credentials are absent", async () => {
  const previousAppId = process.env.WECHAT_APP_ID;
  const previousSecret = process.env.WECHAT_APP_SECRET;
  delete process.env.WECHAT_APP_ID;
  delete process.env.WECHAT_APP_SECRET;
  try {
    const response = await getWechatSignature(new Request("https://same.example/api/wechat/signature"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { configured: false });
  } finally {
    if (previousAppId === undefined) delete process.env.WECHAT_APP_ID;
    else process.env.WECHAT_APP_ID = previousAppId;
    if (previousSecret === undefined) delete process.env.WECHAT_APP_SECRET;
    else process.env.WECHAT_APP_SECRET = previousSecret;
  }
});

test("rejects insecure signing URLs before contacting WeChat", async () => {
  const previousAppId = process.env.WECHAT_APP_ID;
  const previousSecret = process.env.WECHAT_APP_SECRET;
  process.env.WECHAT_APP_ID = "test-app-id";
  process.env.WECHAT_APP_SECRET = "test-app-secret";
  try {
    const response = await getWechatSignature(new Request(
      "https://same.example/api/wechat/signature?url=http%3A%2F%2Fsame.example%2Fresult",
    ));
    assert.equal(response.status, 400);
  } finally {
    if (previousAppId === undefined) delete process.env.WECHAT_APP_ID;
    else process.env.WECHAT_APP_ID = previousAppId;
    if (previousSecret === undefined) delete process.env.WECHAT_APP_SECRET;
    else process.env.WECHAT_APP_SECRET = previousSecret;
  }
});
