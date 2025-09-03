// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Helper: Base64 encode email
function encodeMessage(to: string, from: string, subject: string, html: string) {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\n");

  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Helper: get a fresh access token from Google using refresh token
async function getAccessToken() {
  const client_id = Deno.env.get("GMAIL_CLIENT_ID")!;
  const client_secret = Deno.env.get("GMAIL_CLIENT_SECRET")!;
  const refresh_token = Deno.env.get("GMAIL_REFRESH_TOKEN")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to refresh token");
  return data.access_token as string;
}

serve(async (req : any) => {
  try {
    const { to, subject, html } = await req.json();

    const accessToken = await getAccessToken();
    const from = Deno.env.get("SMTP_USER")!;
    const raw = encodeMessage(to, from, subject, html);

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      },
    );

    const data = await gmailRes.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: gmailRes.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
