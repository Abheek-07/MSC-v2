/**
 * Email delivery service using Resend free tier (100 emails/day)
 * Gracefully logs and degrades if unconfigured or quota reached.
 */

export const EMAIL_DAILY_CAP = 100;

interface SendTicketEmailParams {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketUrl: string;
  qrPayload: string;
}

export async function sendTicketEmail(params: SendTicketEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[Email Service] RESEND_API_KEY not set. Mocking email delivery to ${params.to} for ticket ${params.ticketUrl}`);
    return { success: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MSC SRM AP <tickets@srmap.edu.in>',
        to: [params.to],
        subject: `Your Ticket: ${params.eventTitle} — Microsoft Student Community`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 4px; background: #ffffff;">
            <div style="border-bottom: 2px solid #0067b8; padding-bottom: 12px; margin-bottom: 20px;">
              <h1 style="color: #0067b8; font-size: 20px; margin: 0;">Microsoft Student Community</h1>
              <p style="color: #616161; font-size: 13px; margin: 4px 0 0 0;">SRM University AP &bull; Chapter '26</p>
            </div>
            <h2 style="font-size: 22px; color: #17253d; margin: 0 0 12px 0;">You're Confirmed!</h2>
            <p style="font-size: 15px; color: #17253d; line-height: 1.5;">
              Hi <strong>${params.name}</strong>,<br/>
              Your registration for <strong>${params.eventTitle}</strong> is confirmed.
            </p>
            <div style="background: #f5f5f5; border-left: 4px solid #0067b8; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Date:</strong> ${params.eventDate}</p>
              <p style="margin: 0; font-size: 14px;"><strong>Venue:</strong> ${params.eventLocation}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.ticketUrl}" style="background-color: #0067b8; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 2px; display: inline-block; font-size: 15px;">
                View Digital Ticket & QR Code
              </a>
            </div>
            <p style="font-size: 13px; color: #616161; text-align: center;">
              Keep this ticket handy at check-in. You can also view it anytime with your email at <a href="${params.ticketUrl}" style="color: #0067b8;">${params.ticketUrl}</a>
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[Email Service] Failed to send ticket email:', errorData);
      return { success: false, error: 'Email service provider error' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Email Service] Exception sending email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}
