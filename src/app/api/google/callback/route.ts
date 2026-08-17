import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accountEmail, exchangeCode, primaryTimeZone } from "@/lib/google-calendar";

// Step 2 of connecting Google: swap the one-time code for tokens and store them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const denied = url.searchParams.get("error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  if (denied || !code) {
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent("Google connection was cancelled.")}`);
  }

  try {
    const tokens = await exchangeCode(code, origin);
    const [email, timeZone] = await Promise.all([accountEmail(tokens.access_token), primaryTimeZone(tokens.access_token)]);

    await supabase.from("integrations").upsert(
      {
        user_id: user.id,
        provider: "google",
        access_token: tokens.access_token,
        // Google only hands back a refresh token on the first consent, so keep the old
        // one if this was a re-approval.
        ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        account_email: email,
        time_zone: timeZone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    return NextResponse.redirect(`${origin}/settings?message=${encodeURIComponent("Google Calendar connected.")}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not connect Google.";
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(msg)}`);
  }
}
