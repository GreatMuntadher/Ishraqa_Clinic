/**
 * ============================================================
 *  Ishraqa Dental & Aesthetic Clinic — Configuration
 *  عيادة إشراقة للأسنان والتجميل — الإعدادات
 * ============================================================
 *
 *  HOW TO SET YOUR WEBHOOK:
 *  Replace the placeholder below with your actual n8n webhook URL.
 *  Example: "https://your-n8n-instance.com/webhook/your-endpoint-id"
 *
 * ============================================================
 */

const ISHRAQA_CONFIG = {

  // ─── n8n Webhook URL ───────────────────────────────────────
  // Paste your n8n webhook URL here:
  WEBHOOK_URL: "https://great7muntadher.app.n8n.cloud/webhook/booking",

  // ─── Clinic Info ───────────────────────────────────────────
  CLINIC_NAME: "Ishraqa Dental & Aesthetic Clinic",
  CLINIC_NAME_AR: "عيادة إشراقة للأسنان والتجميل",
  CLINIC_LOCATION: "بغداد - مدينة الصدر",
  CLINIC_PHONE: "+964 XXX XXX XXXX",

  // ─── Booking Source Tag ────────────────────────────────────
  SOURCE: "website",

  // ─── Doctors ───────────────────────────────────────────────
  DOCTORS: [
    { id: "manar",      label: "د. منار",  label_en: "Dr. Manar"  },
    { id: "zahraa",     label: "د. زهراء", label_en: "Dr. Zahraa" },
    { id: "no_pref",    label: "بدون تفضيل", label_en: "No Preference" }
  ],

  // ─── Services ──────────────────────────────────────────────
  SERVICES: [
    { id: "consult",     label: "فحص واستشارة"  },
    { id: "extraction",  label: "قلع الأسنان"   },
    { id: "filling",     label: "تحشية الأسنان" },
    { id: "cleaning",    label: "تنظيف الأسنان" },
    { id: "whitening",   label: "تبييض الأسنان" },
    { id: "lip_filler",  label: "نفخ الشفاه"    },
    { id: "botox",       label: "بوتوكس"         },
    { id: "aesthetic",   label: "تجميل"          },
    { id: "other",       label: "أخرى"           }
  ],

  // ─── Feature Flags (for future use) ───────────────────────
  FEATURES: {
    whatsapp:     false,   // WhatsApp integration — add later
    auth:         false,   // Admin authentication — add later
    email:        false,   // Email — NOT used per requirements
    liveData:     false    // Live dashboard data — add later
  }

};

// Freeze config to prevent accidental mutation
Object.freeze(ISHRAQA_CONFIG);
