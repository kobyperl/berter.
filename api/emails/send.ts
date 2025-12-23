
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const generateEmailHtml = (type: string, data: any) => {
    const headerStyle = `font-family: sans-serif; text-align: right; direction: rtl; background-color: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;`;
    const btnStyle = `display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;
    const footerStyle = `margin-top: 30px; border-top: 1px solid #e2e8f0; pt: 15px; font-size: 12px; color: #94a3b8; text-align: center;`;

    if (type === 'welcome') {
        return `
            <div style="${headerStyle}">
                <h1 style="color: #0d9488; font-size: 24px;">איזה כיף שהצטרפת, ${data.userName}!</h1>
                <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                    שמחים שבחרת להצטרף לקהילת Barter.org.il.<br/>
                    כאן תוכל להפוך את הידע והכישרון שלך למטבע שווה ערך, לחסוך בהוצאות העסק ולפגוש שותפים מדהימים.<br/><br/>
                    <strong>הצעד הבא:</strong> פרסם את הברטר הראשון שלך כדי להתחיל לקבל פניות.
                </p>
                <a href="https://barter.org.il" style="${btnStyle}">פרסם הצעה ראשונה עכשיו</a>
                <div style="${footerStyle}">נשלח על ידי צוות Barter.org.il</div>
            </div>
        `;
    }

    if (type === 'chat_alert') {
        return `
            <div style="${headerStyle}">
                <h1 style="color: #0d9488; font-size: 22px;">היי ${data.userName}, מחכה לך הודעה!</h1>
                <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                    <strong>${data.senderName}</strong> שלח לך הודעה חדשה בצ'אט הפנימי של האתר.<br/>
                    אל תפספס הזדמנות לברטר מצוין - כדאי לענות בהקדם.
                </p>
                <a href="https://barter.org.il" style="${btnStyle}">כנס לצ'אט להשיב</a>
                <div style="${footerStyle}">Barter.org.il - נטוורקינג עסקי אמיתי</div>
            </div>
        `;
    }

    return `<div style="${headerStyle}"><p>עדכון חדש ממערכת Barter.org.il</p></div>`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, data } = req.body;

  if (!type || !to) return res.status(400).json({ error: 'Missing parameters: type or to' });

  try {
    let subject = '';
    switch (type) {
        case 'welcome': subject = 'ברוכים הבאים ל-Barter.org.il!'; break;
        case 'chat_alert': subject = `הודעה חדשה מחכה לך ב-Barter`; break;
        default: subject = 'עדכון חשוב מ-Barter.org.il';
    }

    // Use verified domain email
    const fromEmail = 'Barter IL <info@barter.org.il>';
    const recipients = Array.isArray(to) ? to : [to];

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: subject,
      html: generateEmailHtml(type, data),
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: emailData?.id });
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
