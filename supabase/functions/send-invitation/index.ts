
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  invitationLink: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY is not set");
    }

    console.log("Initializing Resend with API key");
    const resend = new Resend(resendApiKey);
    
    const reqBody = await req.json();
    const { email, invitationLink, role } = reqBody as InvitationEmailRequest;
    
    console.log(`Processing invitation request for ${email} with role ${role}`);
    
    if (!email || !invitationLink) {
      console.error("Missing required fields:", { email, linkProvided: !!invitationLink });
      return new Response(
        JSON.stringify({ error: "Email and invitation link are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending invitation email to ${email} with role ${role}`);
    
    const data = await resend.emails.send({
      from: "TodoHero <onboarding@resend.dev>",
      to: [email],
      subject: "You've been invited to TodoHero",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6; margin-bottom: 24px;">You've been invited to TodoHero</h1>
          <p style="margin-bottom: 16px; font-size: 16px; line-height: 1.5;">
            You've been invited to join TodoHero as a <strong>${role}</strong>.
          </p>
          <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.5;">
            Click the button below to accept the invitation and create your account.
          </p>
          <a href="${invitationLink}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; font-weight: bold;">
            Accept Invitation
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #666;">
            If you're having trouble with the button above, copy and paste the following link into your browser:
          </p>
          <p style="font-size: 14px; word-break: break-all; color: #3b82f6;">
            ${invitationLink}
          </p>
          <p style="margin-top: 32px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 16px;">
            If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", data);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send invitation email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
