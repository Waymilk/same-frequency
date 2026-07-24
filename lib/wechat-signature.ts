import { createHash } from "node:crypto";

type CacheEntry = {
  value: string;
  expiresAt: number;
};

type WechatTokenResponse = {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

type WechatTicketResponse = {
  ticket?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

let accessTokenCache: CacheEntry | null = null;
let ticketCache: CacheEntry | null = null;
let ticketRequest: Promise<string> | null = null;

export function createWechatSignature(ticket: string, url: string, timestamp: number, nonceStr: string) {
  const source = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  return createHash("sha1").update(source).digest("hex");
}

export function wechatCacheExpiry(now: number, expiresInSeconds: number) {
  return now + Math.max(30, expiresInSeconds - 300) * 1000;
}

export function normalizeWechatPageUrl(value: string, requestUrl: string) {
  const target = new URL(value);
  const request = new URL(requestUrl);
  target.hash = "";
  if (target.protocol !== "https:") throw new Error("微信签名页面必须使用 HTTPS");
  if (target.origin !== request.origin) throw new Error("只能签名当前站点页面");
  return target.toString();
}

function cachedValue(entry: CacheEntry | null) {
  return entry && entry.expiresAt > Date.now() ? entry.value : "";
}

async function fetchWechatJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`微信接口请求失败：${response.status}`);
  return response.json() as Promise<T>;
}

async function getAccessToken(appId: string, appSecret: string) {
  const cached = cachedValue(accessTokenCache);
  if (cached) return cached;

  const params = new URLSearchParams({
    grant_type: "client_credential",
    appid: appId,
    secret: appSecret,
  });
  const data = await fetchWechatJson<WechatTokenResponse>(
    `https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`,
  );
  if (!data.access_token || data.errcode) {
    throw new Error(data.errmsg || "微信 access_token 获取失败");
  }
  accessTokenCache = {
    value: data.access_token,
    expiresAt: wechatCacheExpiry(Date.now(), data.expires_in ?? 7200),
  };
  return data.access_token;
}

async function requestJsapiTicket(appId: string, appSecret: string) {
  const cached = cachedValue(ticketCache);
  if (cached) return cached;

  const accessToken = await getAccessToken(appId, appSecret);
  const params = new URLSearchParams({ access_token: accessToken, type: "jsapi" });
  const data = await fetchWechatJson<WechatTicketResponse>(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?${params.toString()}`,
  );
  if (!data.ticket || data.errcode) {
    throw new Error(data.errmsg || "微信 jsapi_ticket 获取失败");
  }
  ticketCache = {
    value: data.ticket,
    expiresAt: wechatCacheExpiry(Date.now(), data.expires_in ?? 7200),
  };
  return data.ticket;
}

export async function getWechatJsapiTicket(appId: string, appSecret: string) {
  const cached = cachedValue(ticketCache);
  if (cached) return cached;
  if (!ticketRequest) {
    ticketRequest = requestJsapiTicket(appId, appSecret).finally(() => {
      ticketRequest = null;
    });
  }
  return ticketRequest;
}

