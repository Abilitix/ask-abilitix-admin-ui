// Mailtrap HTTP API configuration
const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN;
const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

export async function sendWelcomeEmail(
  email: string,
  companyName: string,
  tenantSlug: string,
  dashboardUrl: string
) {
  // Parse EMAIL_FROM safely
  const fromRaw = process.env.EMAIL_FROM || "Abilitix <no-reply@abilitix.com.au>";
  const m = fromRaw.match(/^(.*?)\s*<([^>]+)>$/);
  const FROM_NAME = (m?.[1] || "Abilitix").trim();
  const FROM_EMAIL = (m?.[2] || "no-reply@abilitix.com.au").trim();

  if (!MAILTRAP_TOKEN) {
    console.warn('MAILTRAP_TOKEN not configured, skipping email');
    return;
  }

  const payload = {
    from: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email }],
    subject: `Welcome to Abilitix, ${companyName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Abilitix!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your AI-powered knowledge management platform</p>
        </div>
        
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Hello ${companyName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for signing up for Abilitix! Your workspace has been created successfully.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Workspace Details:</h3>
            <p style="margin: 5px 0;"><strong>Workspace:</strong> ${tenantSlug}</p>
            <p style="margin: 5px 0;"><strong>Dashboard:</strong> <a href="${dashboardUrl}" style="color: #667eea;">${dashboardUrl}</a></p>
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Next Steps:</h3>
            <ol style="color: #666; line-height: 1.6;">
              <li>Access your dashboard using the link above</li>
              <li>Upload your first documents to get started</li>
              <li>Configure your AI assistant settings</li>
              <li>Invite your team members</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">© 2024 Abilitix. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const response = await fetch(MAILTRAP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILTRAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Mailtrap API error: ${response.status} ${response.statusText}`);
    }

    console.log('Welcome email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}