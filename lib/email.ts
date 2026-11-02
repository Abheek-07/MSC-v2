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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

export async function sendTicketEmail(params: SendTicketEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[Email Service] RESEND_API_KEY not set. Mocking email delivery to ${params.to} for ticket ${params.ticketUrl}`);
    return { success: true };
  }

  try {
    const safeName = escapeHtml(params.name);
    const safeEventTitle = escapeHtml(params.eventTitle);
    const safeEventDate = escapeHtml(params.eventDate);
    const safeEventLocation = escapeHtml(params.eventLocation);
    const safeTicketUrl = escapeHtml(params.ticketUrl);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MSC SRM AP <tickets@srmap.edu.in>',
        to: [params.to],
        subject: `Your Ticket: ${params.eventTitle} - Microsoft Student Community`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 4px; background: #ffffff;">
            <div style="border-bottom: 2px solid #0067b8; padding-bottom: 12px; margin-bottom: 20px;">
              <h1 style="color: #0067b8; font-size: 20px; margin: 0;">Microsoft Student Community</h1>
              <p style="color: #616161; font-size: 13px; margin: 4px 0 0 0;">SRM University AP &bull; Chapter '26</p>
            </div>
            <h2 style="font-size: 22px; color: #17253d; margin: 0 0 12px 0;">You're Confirmed!</h2>
            <p style="font-size: 15px; color: #17253d; line-height: 1.5;">
              Hi <strong>${safeName}</strong>,<br/>
              Your registration for <strong>${safeEventTitle}</strong> is confirmed.
            </p>
            <div style="background: #f5f5f5; border-left: 4px solid #0067b8; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Date:</strong> ${safeEventDate}</p>
              <p style="margin: 0; font-size: 14px;"><strong>Venue:</strong> ${safeEventLocation}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safeTicketUrl}" style="background-color: #0067b8; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 2px; display: inline-block; font-size: 15px;">
                View Digital Ticket & QR Code
              </a>
            </div>
            <p style="font-size: 13px; color: #616161; text-align: center;">
              Keep this ticket handy at check-in. You can also view it anytime with your email at <a href="${safeTicketUrl}" style="color: #0067b8;">${safeTicketUrl}</a>
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

export interface RecoveryTicketItem {
  eventTitle: string;
  ticketUrl: string;
  eventDate?: string;
  location?: string;
}

export interface SendTicketRecoveryEmailParams {
  to: string;
  name: string;
  tickets: RecoveryTicketItem[];
}

export async function sendTicketRecoveryEmail(params: SendTicketRecoveryEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[Email Service] RESEND_API_KEY not set. Mocking recovery email delivery to ${params.to} with ${params.tickets.length} passes`);
    return { success: true };
  }

  try {
    const safeName = escapeHtml(params.name);
    const ticketsListHtml = params.tickets.map((t) => {
      const safeTitle = escapeHtml(t.eventTitle);
      const safeUrl = escapeHtml(t.ticketUrl);
      const safeDate = t.eventDate ? escapeHtml(t.eventDate) : 'Upcoming';
      return `
        <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 14px; margin-bottom: 12px; background: #fafafa;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #17253d;">${safeTitle}</h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #616161;">Date: ${safeDate}</p>
          <a href="${safeUrl}" style="background-color: #0067b8; color: #ffffff; text-decoration: none; padding: 8px 16px; font-weight: 600; border-radius: 2px; display: inline-block; font-size: 13px;">
            Open Your Digital Pass &rarr;
          </a>
        </div>
      `;
    }).join('');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MSC SRM AP <tickets@srmap.edu.in>',
        to: [params.to],
        subject: 'Your Requested MSC Event Pass Access Link',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 4px; background: #ffffff;">
            <div style="border-bottom: 2px solid #0067b8; padding-bottom: 12px; margin-bottom: 20px;">
              <h1 style="color: #0067b8; font-size: 20px; margin: 0;">Microsoft Student Community</h1>
              <p style="color: #616161; font-size: 13px; margin: 4px 0 0 0;">SRM University AP &bull; Chapter '26</p>
            </div>
            <h2 style="font-size: 20px; color: #17253d; margin: 0 0 12px 0;">Pass Access Requested</h2>
            <p style="font-size: 14px; color: #17253d; line-height: 1.5;">
              Hi <strong>${safeName}</strong>,<br/>
              We received a request to retrieve your event pass credentials. Below are your verified pass links:
            </p>
            <div style="margin: 20px 0;">
              ${ticketsListHtml}
            </div>
            <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 24px;">
              If you did not request this email, you can safely ignore it. Your pass remains secure.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[Email Service] Failed to send recovery email:', errorData);
      return { success: false, error: 'Email service provider error' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Email Service] Exception sending recovery email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}
