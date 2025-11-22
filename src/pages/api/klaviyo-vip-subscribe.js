// src/pages/api/klaviyo-vip-subscribe.js

export const POST = async (context) => {
  // 1. Cloudflare 运行时 env（线上）
  const runtimeEnv = context?.locals?.runtime?.env;

  // 2. 先用 Cloudflare env，其次用本地 import.meta.env（dev）
  const apiKey =
    (runtimeEnv && runtimeEnv.KLAVIYO_API_KEY) || import.meta.env.KLAVIYO_API_KEY;

  const vipListId =
    (runtimeEnv && runtimeEnv.KLAVIYO_VIP_LIST_ID) ||
    import.meta.env.KLAVIYO_VIP_LIST_ID;

  if (!apiKey || !vipListId) {
    console.error(
      "KLAVIYO_API_KEY or KLAVIYO_VIP_LIST_ID is missing (Cloudflare runtime & import.meta.env both empty)"
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server config error: missing KLAVIYO_API_KEY or KLAVIYO_VIP_LIST_ID.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();

  if (!email) {
    return new Response(
      JSON.stringify({ success: false, error: "Email is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Klaviyo 新 API base URL
  const BASE_URL = "https://a.klaviyo.com/api";

  // 公共请求头（新 API 要求）
  const commonHeaders = {
    Authorization: `KLV ${apiKey}`,
    "Content-Type": "application/json",
    revision: "2023-10-15",
  };

  try {
    // 1）创建或更新 Profile
    //    使用 /api/profiles/ 的 create-or-update 语义
    const profilePayload = {
      data: {
        type: "profile",
        attributes: {
          email: email,
          ...(name && { first_name: name }),
          // 你可以顺便打个标记，方便在 Klaviyo 里筛选
          properties: {
            vip_deposit: true,
            vip_deposit_amount: 5,
            vip_deposit_currency: "USD",
          },
        },
      },
    };

    const createProfileRes = await fetch(`${BASE_URL}/profiles/`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(profilePayload),
    });

    const profileData = await createProfileRes.json();

    if (!createProfileRes.ok) {
      console.error("Klaviyo create profile error:", profileData);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            profileData?.errors?.[0]?.detail ||
            "Failed to create/update Klaviyo profile",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const profileId = profileData?.data?.id;
    if (!profileId) {
      console.error("Klaviyo: no profile id returned:", profileData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Klaviyo did not return profile ID",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2）把这个 profile 加入 VIP list
    const listPayload = {
      data: [
        {
          type: "profile",
          id: profileId,
        },
      ],
    };

    const addToListRes = await fetch(
      `${BASE_URL}/lists/${vipListId}/relationships/profiles/`,
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify(listPayload),
      }
    );

    const addToListData = await addToListRes.json().catch(() => ({}));

    if (!addToListRes.ok) {
      console.error("Klaviyo add to list error:", addToListData);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            addToListData?.errors?.[0]?.detail ||
            "Failed to add profile to VIP list",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 成功
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Klaviyo VIP subscribe unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unexpected server error when calling Klaviyo",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
