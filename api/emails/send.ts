
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Initialize Resend with the API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate HTML content based on type (Backend rendering)
const generateEmailHtml = (type: string, data: any) => {
    const headerStyle = `font-family: sans-serif; text-align: right; direction: rtl; background-color: #f8fafc; padding: 20px; border-radius: 8px;`;
    const btnStyle = `display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;`;

    if (type === 'welcome') {
        return `
            <div style="${headerStyle}">
                <h1 style="color: #0d9488;">איזה כיף שהצטרפת!</h1>
                <p style="font-size: 16px; color: #475569;">
                    היי ${data.userName},<br/><br/>
                    שמחים שבחרת להצטרף לקהילת Barter.org.il.<br/>
                    מעכשיו תוכל לפרסם הצעות בקלות, למצוא שיתופי פעולה מדויקים ולקבל פניות רלוונטיות.
                </p>
                <a href="https://barter.org.il" style="${btnStyle}">כנס והעלה את ההצעה הראשונה שלך</a>
            </div>
        `;
    }

    if (type === 'chat_alert') {
        return `
            <div style="${headerStyle}">
                <h1 style="color: #0d9488;">הודעה חדשה מחכה לך</h1>
                <p style="font-size: 16px; color: #475569;">
                    היי ${data.userName},<br/><br/>
                    <strong>${data.senderName}</strong> שלח לך הודעה חדשה בצ'אט באתר.<br/>
                    אל תיתן להזדמנות להתקרר!
                </p>
                <a href="https://barter.org.il" style="${btnStyle}">עבור לצ'אט כדי להשיב</a>
            </div>
        `;
    }

    if (type === 'smart_match') {
        return `
            <div style="${headerStyle}">
                <h1 style="color: #0d9488;">מצאנו התאמה עבורך!</h1>
                <p style="font-size: 16px; color: #475569;">
                    האלגוריתם שלנו זיהה הצעות חדשות שמתאימות בול לפרופיל המקצועי שלך.
                </p>
                <a href="https://barter.org.il" style="${btnStyle}">לצפייה בכל ההתאמות</a>
            </div>
        `;
    }

    return `<p>הודעה ממערכת Barter.org.il</p>`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing parameters: type or to' });
  }

  try {
    let subject = '';
    
    // Determine subject based on type
    switch (type) {
        case 'welcome': subject = 'ברוכים הבאים ל-Barter.org.il!'; break;
        case 'chat_alert': subject = `הודעה חדשה מ-${data.senderName}`; break;
        case 'smart_match': subject = 'מצאנו עבורך פרויקטים חדשים!'; break;
        default: subject = 'עדכון מ-Barter.org.il';
    }

    // FIX: Use 'onboarding@resend.dev' as default to prevent 400 Bad Request error on unverified domains.
    // Once you verify 'barter.org.il' in Resend dashboard, you can set EMAIL_FROM env var.
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    console.log(`Sending email [${type}] from ${fromEmail} to ${to}`);

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: generateEmailHtml(type, data),
    });

    if (error) {
      console.error('Resend API Error:', JSON.stringify(error, null, 2));
      return res.status(400).json({ 
          error: 'Email Sending Failed', 
          details: error.message,
          code: error.name
      });
    }

    return res.status(200).json({ success: true, id: emailData?.id });
  } catch (err: any) {
    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
