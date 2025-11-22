// src/pages/api/klaviyo-vip-subscribe.js

export const POST = async (context) => {
  // 1. Cloudflare 运行时环境里的变量（线上）
  const runtimeEnv = context?.locals?.runtime?.env;

  // 2. 优先用 Cloudflare 的 env，其次用本地的 import.meta.env（本地 dev 时用）
  const klaviyoApiKey =
    (runtimeEnv && runtimeEnv.KLAVIYO_API_KEY_PRIVATE) ||
    import.meta.env.KLAVIYO_API_KEY_PRIVATE;

  const klaviyoVipListId =
    (runtimeEnv && runtimeEnv.KLAVIYO_VIP_LIST_ID) ||
    import.meta.env.KLAVIYO_VIP_LIST_ID;

  if (!klaviyoApiKey || !klaviyoVipListId) {
    console.error(
      'KLAVIYO_API_KEY_PRIVATE or KLAVIYO_VIP_LIST_ID is missing (Cloudflare runtime & import.meta.env both empty)'
    );
    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Server config error: KLAVIYO_API_KEY_PRIVATE or KLAVIYO_VIP_LIST_ID is missing.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. 解析前端传来的 email / name
  let jsonBody = null;
  try {
    jsonBody = await context.request.json();
  } catch (_) {
    jsonBody = null;
  }

  const rawEmail = jsonBody?.email || '';
  const rawName = jsonBody?.name || '';

  const email = String(rawEmail).trim().toLowerCase();
  const name = String(rawName).trim();

  if (!email) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing email in request body.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. 组装 Klaviyo API 请求
  const apiUrl = `https://a.klaviyo.com/api/v2/list/${encodeURIComponent(
    klaviyoVipListId
  )}/members?api_key=${encodeURIComponent(klaviyoApiKey)}`;

  // v2 List Members API 需要 profiles 数组
  const payload = {
    profiles: [
      {
        email,
        $first_name: name || undefined,
        properties: {
          vip_source: 'stripe_vip_checkout',
          vip_created_at: new Date().toISOString(),
        },
      },
    ],
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      console.error('Klaviyo API error:', res.status, data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.message || data?.detail || 'Klaviyo API error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 成功：不需要把 Klaviyo 原始数据暴露给前端，简单返回 success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Klaviyo VIP subscribe failed:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Request to Klaviyo failed.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
