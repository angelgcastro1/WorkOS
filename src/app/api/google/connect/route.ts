import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consentUrl, googleConfigured } from "@/lib/google-calendar";

// Step 1 of connecting Google: bounce the user to Google's consent screen.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent("Google keys are not set up yet.")}`);
  }
  return NextResponse.redirect(consentUrl(origin, user.id));
}
