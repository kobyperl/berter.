
// This file acts as a Vercel Serverless Function
// Place it in /api/emails/send.ts

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing parameters' });
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

    // Since users usually don't verify domain in demo, use 'onboarding@resend.dev' for testing
    // Or assume the user configured a domain.
    const fromEmail = process.env.EMAIL_FROM || 'Barter Team <team@barter.org.il>';
    // If using free tier of Resend without domain, must send to 'delivered@resend.dev' OR verified email only.
    // For production logic:
    
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: generateEmailHtml(type, data),
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ success: true, id: emailData?.id });
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
