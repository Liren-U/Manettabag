// src/pages/api/klaviyo-subscribe.js

export const POST = async (context) => {
  // 1. Cloudflare 运行时 env（部署时）
  const runtimeEnv = context?.locals?.runtime?.env;

  // 2. 先用 Cloudflare env，其次用本地 import.meta.env（本地 dev）
  const apiKey =
    (runtimeEnv && runtimeEnv.KLAVIYO_API_KEY) || import.meta.env.KLAVIYO_API_KEY;

  // ✅ 这里使用“普通订阅列表”的 List ID（不是 VIP 那个）
  const mainListId =
    (runtimeEnv && runtimeEnv.KLAVIYO_MAIN_LIST_ID) ||
    import.meta.env.KLAVIYO_MAIN_LIST_ID; // 名字你可以自己定，只要前后一致

  if (!apiKey || !mainListId) {
    console.error(
      "KLAVIYO_API_KEY or KLAVIYO_MAIN_LIST_ID is missing (Cloudflare runtime & import.meta.env both empty)"
    );
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Server config error: missing KLAVIYO_API_KEY or KLAVIYO_MAIN_LIST_ID.",
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

  const BASE_URL = "https://a.klaviyo.com/api";

  const commonHeaders = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    "Content-Type": "application/json",
    revision: "2023-12-15",
  };

  try {
    // 1）创建或更新 Profile（这里没有 VIP 属性，只是普通订阅）
    const profilePayload = {
      data: {
        type: "profile",
        attributes: {
          email: email,
          ...(name && { first_name: name }),
          // 如果你想给普通订阅打一个 tag，可以在这里加：
          // properties: { free_waitlist: true },
        },
      },
    };

    const createProfileRes = await fetch(`${BASE_URL}/profiles/`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(profilePayload),
    });

    const profileData = await createProfileRes.json().catch(() => ({}));

    let profileId = profileData?.data?.id;

    // 处理重复 profile 的情况
    if (!createProfileRes.ok) {
      const firstError = profileData?.errors?.[0];

      if (
        firstError &&
        firstError.code === "duplicate_profile" &&
        firstError.meta &&
        firstError.meta.duplicate_profile_id
      ) {
        profileId = firstError.meta.duplicate_profile_id;
        console.log(
          "[Klaviyo Free] duplicate_profile, use existing profile id:",
          profileId
        );
      } else {
        console.error("Klaviyo create profile error:", profileData);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              firstError?.detail ||
              "Failed to create/update Klaviyo profile for free subscriber",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!profileId) {
      console.error("[Klaviyo Free] no profile id returned:", profileData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Klaviyo did not return profile ID",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2）把 profile 加入“普通订阅 List”
    const listPayload = {
      data: [
        {
          type: "profile",
          id: profileId,
        },
      ],
    };

    const addToListRes = await fetch(
      `${BASE_URL}/lists/${mainListId}/relationships/profiles/`,
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify(listPayload),
      }
    );

    const addToListData = await addToListRes.json().catch(() => ({}));

    if (!addToListRes.ok) {
      console.error("[Klaviyo Free] add to list error:", addToListData);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            addToListData?.errors?.[0]?.detail ||
            "Failed to add profile to main list",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 成功
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Klaviyo FREE subscribe unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unexpected server error when calling Klaviyo",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
