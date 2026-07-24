import {
  createWechatSignature,
  getWechatJsapiTicket,
  normalizeWechatPageUrl,
} from "../../../../lib/wechat-signature.ts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    return Response.json({ configured: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const requestUrl = new URL(request.url);
  const rawPageUrl = requestUrl.searchParams.get("url");
  if (!rawPageUrl) return Response.json({ error: "缺少页面地址" }, { status: 400 });

  let pageUrl = "";
  try {
    pageUrl = normalizeWechatPageUrl(rawPageUrl, request.url);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "页面地址无效" },
      { status: 400 },
    );
  }

  try {
    const ticket = await getWechatJsapiTicket(appId, appSecret);
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = crypto.randomUUID().replaceAll("-", "");
    const signature = createWechatSignature(ticket, pageUrl, timestamp, nonceStr);

    return Response.json(
      { configured: true, appId, timestamp, nonceStr, signature },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Wechat signature error", error);
    return Response.json({ error: "微信分享暂时不可用" }, { status: 502 });
  }
}
