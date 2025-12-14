
import React from 'react';

// Common styles mimicking email clients
const containerStyle = "font-sans text-slate-800 bg-slate-50 p-6 rounded-lg direction-rtl text-right border border-slate-200";
const headerStyle = "text-2xl font-bold text-brand-600 mb-4 border-b border-slate-200 pb-4";
const bodyStyle = "text-base leading-relaxed text-slate-600 mb-6";
const buttonStyle = "inline-block bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg no-underline hover:bg-emerald-700 transition-colors";
const footerStyle = "mt-8 text-xs text-slate-400 border-t border-slate-200 pt-4 text-center";

export const WelcomeEmailPreview = () => (
  <div className={containerStyle} dir="rtl">
    <h1 className={headerStyle}>איזה כיף שהצטרפת! ההזדמנויות מחכות לך.</h1>
    <p className={bodyStyle}>
      היי [שם המשתמש],<br/><br/>
      שמחים שבחרת להצטרף לקהילה שלנו. מעכשיו תוכל לפרסם הצעות בקלות, 
      למצוא שיתופי פעולה מדויקים ולקבל פניות רלוונטיות מאנשי מקצוע איכותיים.<br/><br/>
      השלב הבא הוא קריטי להצלחה שלך בפלטפורמה:
    </p>
    <div className="text-center my-6">
        <span className={buttonStyle}>כנס והעלה את ההצעה הראשונה שלך</span>
    </div>
    <div className={footerStyle}>
      © 2024 Barter.org.il | כל הזכויות שמורות
    </div>
  </div>
);

export const ChatMessageAlertPreview = () => (
  <div className={containerStyle} dir="rtl">
    <h1 className={headerStyle}>היי [שם המשתמש], מחכה לך הודעה חדשה!</h1>
    <p className={bodyStyle}>
      <strong>[שם השולח]</strong> התעניין בהצעה שלך וכתב לך בצ'אט הפנימי באתר.<br/><br/>
      הברטרים הטובים ביותר נסגרים מהר. אל תיתן להזדמנות להתקרר!
    </p>
    <div className="text-center my-6">
        <span className={buttonStyle}>עבור לצ'אט כדי להשיב</span>
    </div>
    <div className={footerStyle}>
      לחץ כאן כדי להסיר את עצמך מרשימת התפוצה
    </div>
  </div>
);

export const SmartMatchAlertPreview = () => (
  <div className={containerStyle} dir="rtl">
    <h1 className={headerStyle}>מצאנו עבורך פרויקטים חדשים ב-[תחום העניין]!</h1>
    <p className={bodyStyle}>
      האלגוריתם שלנו עובד שעות נוספות :)<br/>
      זיהינו הצעות חדשות שפורסמו ביממה האחרונה ומתאימות בול לפרופיל המקצועי שלך.<br/><br/>
      אל תחכה שאחרים יחטפו את ההזדמנות.
    </p>
    <div className="text-center my-6">
        <span className={buttonStyle}>לצפייה בכל ההתאמות</span>
    </div>
    <div className={footerStyle}>
      נשלח אליך כי נרשמת לעדכונים בנושא [תחום העניין]
    </div>
  </div>
);
