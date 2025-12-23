
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Initialize Resend with the API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate HTML content based on type (Backend rendering)
const generateEmailHtml = (type: string, data: any) => {
    const headerStyle = `font-family: sans-serif; text-align: right; direction: rtl; background-color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;`;
    const btnStyle = `display: inline-block; background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 16px;`;
    const footerStyle = `margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;`;

    if (type === 'welcome') {
        return `
            <div style="${headerStyle}">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">🌟</span>
                </div>
                <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 16px;">איזה כיף שהצטרפת!</h1>
                <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                    היי ${data.userName || 'חדש'},<br/><br/>
                    שמחים שבחרת להצטרף לקהילת <strong>Barter.org.il</strong> - זירת הברטר המקצועית של העצמאים בישראל.<br/><br/>
                    מעכשיו תוכל למנף את הכישורים שלך כמטבע, לחסוך הוצאות ולייצר קשרים עסקיים איכותיים.<br/>
                    השלב הבא? פרסום ההצעה הראשונה שלך!
                </p>
                <div style="text-align: center;">
                    <a href="https://barter.org.il" style="${btnStyle}">פרסם הצעה ראשונה עכשיו</a>
                </div>
                <div style="${footerStyle}">
                    © 2024 Barter.org.il | כלכלה שיתופית לעצמאים
                </div>
            </div>
        `;
    }

    if (type === 'chat_alert') {
        return `
            <div style="${headerStyle}">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">💬</span>
                </div>
                <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 16px;">הודעה חדשה מחכה לך</h1>
                <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                    היי ${data.userName || 'יקר/ה'},<br/><br/>
                    קיבלת הודעה חדשה מ-<strong>${data.senderName || 'משתמש באתר'}</strong> בנוגע להצעה שלך.<br/>
                    הברטרים הטובים ביותר נסגרים כשההצעה חמה - אל תחכה!
                </p>
                <div style="text-align: center;">
                    <a href="https://barter.org.il" style="${btnStyle}">עבור לצ'אט כדי להשיב</a>
                </div>
                <div style="${footerStyle}">
                    נשלח אליך כי ההודעה הגיעה בזמן שלא היית מחובר/ת לאתר.
                </div>
            </div>
        `;
    }

    if (type === 'smart_match') {
        return `
            <div style="${headerStyle}">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">🎯</span>
                </div>
                <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 16px;">מצאנו התאמה בול בשבילך!</h1>
                <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                    היי ${data.userName || 'יקר/ה'},<br/><br/>
                    האלגוריתם שלנו זיהה הצעות חדשות באתר שמתאימות בדיוק לתחום העיסוק והצרכים שלך.<br/>
                    בוא לראות מי מחפש את מה שיש לך לתת.
                </p>
                <div style="text-align: center;">
                    <a href="https://barter.org.il" style="${btnStyle}">לצפייה בהתאמות שלי</a>
                </div>
                <div style="${footerStyle}">
                    עדכונים חכמים מבוססי AI - Barter.org.il
                </div>
            </div>
        `;
    }

    return `<div style="${headerStyle}"><p>הודעה ממערכת Barter.org.il</p></div>`;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing parameters: type or to' });
  }

  try {
    let subject = '';
    
    switch (type) {
        case 'welcome': subject = 'ברוכים הבאים ל-Barter.org.il! 🌟'; break;
        case 'chat_alert': subject = `💬 הודעה חדשה מחכה לך מ-${data.senderName || 'משתמש'}`; break;
        case 'smart_match': subject = '🎯 מצאנו התאמה חכמה עבורך!'; break;
        default: subject = 'עדכון חשוב מ-Barter.org.il';
    }

    const fromEmail = 'Barter.org.il <info@barter.org.il>';
    const recipients = Array.isArray(to) ? to : [to];

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: subject,
      html: generateEmailHtml(type, data),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ error: 'Email Sending Failed', details: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });
  } catch (err: any) {
    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
