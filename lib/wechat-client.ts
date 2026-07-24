type WechatSignatureResponse = {
  configured: boolean;
  appId?: string;
  timestamp?: number;
  nonceStr?: string;
  signature?: string;
};

type WechatShareData = {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
};

type WechatSdk = {
  config(options: {
    debug: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }): void;
  ready(callback: () => void): void;
  error(callback: (error: unknown) => void): void;
  updateAppMessageShareData(options: WechatShareData & {
    success?: () => void;
    fail?: (error: unknown) => void;
  }): void;
};

declare global {
  interface Window {
    wx?: WechatSdk;
  }
}

let sdkPromise: Promise<WechatSdk> | null = null;

export type WechatShareStatus = "ready" | "unconfigured" | "failed" | "unsupported";

export function isWechatBrowser(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent) {
  return /MicroMessenger/i.test(userAgent);
}

function loadWechatSdk() {
  if (window.wx) return Promise.resolve(window.wx);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<WechatSdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-wechat-sdk="true"]');
    const script = existing ?? document.createElement("script");
    const onLoad = () => window.wx ? resolve(window.wx) : reject(new Error("微信 JS-SDK 未加载"));
    const onError = () => reject(new Error("微信 JS-SDK 加载失败"));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
      script.async = true;
      script.dataset.wechatSdk = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });
  return sdkPromise;
}

function waitForWechatReady(wx: WechatSdk, config: Omit<Parameters<WechatSdk["config"]>[0], "debug" | "jsApiList">) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("微信分享配置超时")), 8000);
    wx.ready(() => {
      window.clearTimeout(timeout);
      resolve();
    });
    wx.error((error) => {
      window.clearTimeout(timeout);
      reject(error);
    });
    wx.config({ ...config, debug: false, jsApiList: ["updateAppMessageShareData"] });
  });
}

export async function configureWechatShare(data: WechatShareData): Promise<WechatShareStatus> {
  if (!isWechatBrowser()) return "unsupported";
  try {
    const pageUrl = window.location.href.split("#")[0];
    const response = await fetch(`/api/wechat/signature?url=${encodeURIComponent(pageUrl)}`, { cache: "no-store" });
    if (!response.ok) return "failed";
    const signature = await response.json() as WechatSignatureResponse;
    if (!signature.configured) return "unconfigured";
    if (!signature.appId || !signature.timestamp || !signature.nonceStr || !signature.signature) return "failed";

    const wx = await loadWechatSdk();
    await waitForWechatReady(wx, {
      appId: signature.appId,
      timestamp: signature.timestamp,
      nonceStr: signature.nonceStr,
      signature: signature.signature,
    });
    await new Promise<void>((resolve, reject) => {
      wx.updateAppMessageShareData({ ...data, success: resolve, fail: reject });
    });
    return "ready";
  } catch {
    return "failed";
  }
}

