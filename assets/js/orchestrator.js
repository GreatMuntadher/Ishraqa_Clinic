/**
 * ============================================================
 *  Ishraqa Clinic — Project Orchestrator Agent
 *  مركز قيادة مشروع عيادة إشراقة
 * ============================================================
 *  Stores project state in localStorage.
 *  Generates task-specific prompts for Claude Code, n8n, ChatGPT.
 *  Generates Telegram alert drafts for missing manual inputs.
 *  Tracks tasks: completed / in_progress / pending / blocked.
 *  Export / Import project state as JSON.
 * ============================================================
 */

(function () {
  "use strict";

  // ════════════════════════════════════════════════════════════
  //  DEFAULT PROJECT STATE
  // ════════════════════════════════════════════════════════════
  const DEFAULT_STATE = {
    projectName: "Ishraqa Dental & Aesthetic Clinic",
    arabicName:  "عيادة إشراقة للأسنان والتجميل",
    currentPhase: "MVP Booking Stabilization",
    lastUpdated: new Date().toISOString(),
    stack: {
      frontend:      "GitHub Pages + Vanilla JS",
      automation:    "n8n Cloud",
      database:      "Google Sheets",
      notifications: "Telegram",
      future:        "WhatsApp"
    },
    links: {
      liveSite:     "https://greatmuntadher.github.io/Ishraqa_Clinic/index.html",
      bookingPage:  "https://greatmuntadher.github.io/Ishraqa_Clinic/booking.html",
      googleSheet:  "",
      n8nWorkflow:  ""
    },
    manualInputsNeeded: [
      {
        id:          "telegram_bot_token",
        title:       "Telegram Bot Token",
        titleAr:     "توكن بوت التيليغرام",
        description: "Required to send booking and project alerts to the admin.",
        descAr:      "مطلوب لإرسال تنبيهات الحجز وتنبيهات المشروع للمدير.",
        priority:    "high",
        status:      "missing",
        value:       ""
      },
      {
        id:          "telegram_chat_id",
        title:       "Telegram Chat ID",
        titleAr:     "معرّف محادثة التيليغرام",
        description: "Required to know where Telegram alerts should be sent.",
        descAr:      "مطلوب لتحديد وجهة رسائل التيليغرام.",
        priority:    "high",
        status:      "missing",
        value:       ""
      },
      {
        id:          "clinic_phone",
        title:       "Clinic Phone Number",
        titleAr:     "رقم هاتف العيادة",
        description: "Required for the website footer and booking confirmation messages.",
        descAr:      "مطلوب في تذييل الموقع ورسائل تأكيد الحجز.",
        priority:    "medium",
        status:      "missing",
        value:       ""
      },
      {
        id:          "google_maps_link",
        title:       "Google Maps Link",
        titleAr:     "رابط خريطة جوجل",
        description: "Required for clinic location button.",
        descAr:      "مطلوب لزر موقع العيادة.",
        priority:    "medium",
        status:      "missing",
        value:       ""
      },
      {
        id:          "doctor_schedules",
        title:       "Doctor Schedules",
        titleAr:     "جداول الأطباء",
        description: "Required to prevent appointment conflicts later.",
        descAr:      "مطلوب لمنع تعارض المواعيد لاحقاً.",
        priority:    "medium",
        status:      "missing",
        value:       ""
      }
    ],
    tasks: [
      {
        id:          "stabilize_booking_payload",
        title:       "Stabilize booking payload in n8n",
        titleAr:     "تثبيت payload الحجز في n8n",
        owner:       "n8n",
        status:      "in_progress",
        priority:    "critical",
        description: "Ensure booking submissions are saved with full data in Patients and Appointments sheets."
      },
      {
        id:          "fix_google_sheets_mapping",
        title:       "Fix Google Sheets mapping — empty rows",
        titleAr:     "إصلاح ربط Google Sheets — الصفوف الفارغة",
        owner:       "n8n",
        status:      "in_progress",
        priority:    "critical",
        description: "Create New Patient and Save Appointment must reference Normalize Booking Payload directly instead of $json after Sheets nodes."
      },
      {
        id:          "activate_telegram_notifications",
        title:       "Activate Telegram notifications",
        titleAr:     "تفعيل إشعارات تيليغرام",
        owner:       "n8n",
        status:      "blocked",
        priority:    "high",
        blockedBy:   ["telegram_bot_token", "telegram_chat_id"],
        description: "Create Telegram notification node that fires on each new booking."
      },
      {
        id:          "make_admin_dashboard_dynamic",
        title:       "Connect admin dashboard to live data",
        titleAr:     "ربط لوحة الإدارة ببيانات حقيقية",
        owner:       "claude",
        status:      "pending",
        priority:    "high",
        description: "Replace static mock data in admin.js with a fetch() call to the n8n read endpoint."
      },
      {
        id:          "create_project_control_center",
        title:       "Create Project Orchestrator Agent page",
        titleAr:     "إنشاء صفحة وكيل قيادة المشروع",
        owner:       "claude",
        status:      "completed",
        priority:    "high",
        description: "Internal control center for tracking project progress and generating prompts."
      },
      {
        id:          "add_patient_registry",
        title:       "Add patient registry view",
        titleAr:     "إضافة عرض سجل المرضى",
        owner:       "claude",
        status:      "pending",
        priority:    "medium",
        description: "A new page or tab showing all registered patients with search and filter."
      },
      {
        id:          "add_appointment_status_flow",
        title:       "Add appointment status update flow",
        titleAr:     "إضافة تدفق تحديث حالة الموعد",
        owner:       "n8n",
        status:      "pending",
        priority:    "medium",
        description: "n8n workflow to update appointment status (confirmed/completed/cancelled) in Google Sheets."
      },
      {
        id:          "add_review_workflow",
        title:       "Add post-visit review workflow",
        titleAr:     "إضافة تدفق تقييم ما بعد الزيارة",
        owner:       "n8n",
        status:      "pending",
        priority:    "medium",
        description: "Automated workflow to request patient review 24h after appointment completion."
      }
    ],
    roadmap: [
      {
        phase: "Phase 1",
        phaseAr: "المرحلة الأولى",
        title: "Booking MVP Stabilization",
        titleAr: "تثبيت نظام الحجز الأساسي",
        status: "active",
        goals: [
          "Website sends booking data correctly",
          "n8n receives webhook and normalizes data",
          "Appointments sheet stores full booking data",
          "Patients sheet stores full patient data"
        ],
        goalsAr: [
          "الموقع يرسل بيانات الحجز بشكل صحيح",
          "n8n يستقبل الـ webhook ويُعالج البيانات",
          "ورقة المواعيد تخزن بيانات الحجز الكاملة",
          "ورقة المرضى تخزن بيانات المريض الكاملة"
        ]
      },
      {
        phase: "Phase 2",
        phaseAr: "المرحلة الثانية",
        title: "Admin Alerts",
        titleAr: "تنبيهات المدير",
        status: "upcoming",
        goals: [
          "Telegram booking alerts",
          "Manual action alerts",
          "Workflow failure alerts"
        ],
        goalsAr: [
          "تنبيهات حجز عبر تيليغرام",
          "تنبيهات الإجراءات اليدوية",
          "تنبيهات فشل سير العمل"
        ]
      },
      {
        phase: "Phase 3",
        phaseAr: "المرحلة الثالثة",
        title: "Admin Dashboard",
        titleAr: "لوحة الإدارة",
        status: "upcoming",
        goals: [
          "View appointments with live data",
          "Filter by status, doctor, date",
          "View returning patients",
          "Export data to CSV"
        ],
        goalsAr: [
          "عرض المواعيد ببيانات حية",
          "تصفية حسب الحالة والطبيب والتاريخ",
          "عرض المرضى العائدين",
          "تصدير البيانات إلى CSV"
        ]
      },
      {
        phase: "Phase 4",
        phaseAr: "المرحلة الرابعة",
        title: "Clinic Operations",
        titleAr: "العمليات الداخلية للعيادة",
        status: "upcoming",
        goals: [
          "Doctor schedules management",
          "Appointment conflict prevention",
          "Status update flows",
          "Review collection"
        ],
        goalsAr: [
          "إدارة جداول الأطباء",
          "منع تعارض المواعيد",
          "تدفقات تحديث الحالة",
          "جمع التقييمات"
        ]
      },
      {
        phase: "Phase 5",
        phaseAr: "المرحلة الخامسة",
        title: "WhatsApp and Advanced Automation",
        titleAr: "واتساب والأتمتة المتقدمة",
        status: "upcoming",
        goals: [
          "WhatsApp booking confirmations",
          "WhatsApp appointment reminders",
          "AI triage for urgent/pain cases"
        ],
        goalsAr: [
          "تأكيد الحجوزات عبر واتساب",
          "تذكيرات المواعيد عبر واتساب",
          "فرز الحالات العاجلة بالذكاء الاصطناعي"
        ]
      }
    ]
  };

  // ════════════════════════════════════════════════════════════
  //  PROMPT LIBRARY
  // ════════════════════════════════════════════════════════════
  const PROMPTS = {

    // ── n8n AI Agent prompts ───────────────────────────────────
    n8n: [
      {
        id:     "fix_empty_sheets_rows",
        title:  "Fix empty Google Sheets rows",
        titleAr:"إصلاح الصفوف الفارغة في Google Sheets",
        urgent: true,
        linkedTask: "fix_google_sheets_mapping",
        body: `The n8n workflow is creating rows in Google Sheets but most fields are empty.

Fix both "Create New Patient" and "Save Appointment" nodes so they do NOT rely on $json after any Google Sheets or IF nodes. They must reference the "Normalize Booking Payload" node directly using expressions like:

{{ $("Normalize Booking Payload").first().json.booking.patient_name }}
{{ $("Normalize Booking Payload").first().json.booking.phone }}
{{ $("Normalize Booking Payload").first().json.booking.age }}
{{ $("Normalize Booking Payload").first().json.booking.gender }}
{{ $("Normalize Booking Payload").first().json.booking.doctor }}
{{ $("Normalize Booking Payload").first().json.booking.service }}
{{ $("Normalize Booking Payload").first().json.booking.booking_type }}
{{ $("Normalize Booking Payload").first().json.booking.preferred_date }}
{{ $("Normalize Booking Payload").first().json.booking.preferred_time }}
{{ $("Normalize Booking Payload").first().json.booking.has_pain }}
{{ $("Normalize Booking Payload").first().json.booking.pain_level }}
{{ $("Normalize Booking Payload").first().json.booking.patient_notes }}
{{ $("Normalize Booking Payload").first().json.booking.source }}
{{ $("Normalize Booking Payload").first().json.booking.created_at }}

Also map:
- clinic_name  → {{ $("Normalize Booking Payload").first().json.booking.clinic_name }}
- source       → {{ $("Normalize Booking Payload").first().json.booking.source }}

Keep the Telegram node deactivated for now.
After fixing, activate and publish the workflow.
Test with a real booking submission from:
https://greatmuntadher.github.io/Ishraqa_Clinic/booking.html`
      },
      {
        id:     "add_telegram_booking_alert",
        title:  "Add Telegram booking notification",
        titleAr:"إضافة إشعار حجز عبر تيليغرام",
        urgent: false,
        linkedTask: "activate_telegram_notifications",
        body: `Add a Telegram Send Message node at the end of the main booking workflow in n8n.

The node should fire after both "Create New Patient" and "Save Appointment" succeed.
Use the Telegram Bot credentials stored in n8n.

Message format (Arabic):
📅 حجز جديد — عيادة إشراقة

👤 المريض: {{ $("Normalize Booking Payload").first().json.booking.patient_name }}
📞 الهاتف: {{ $("Normalize Booking Payload").first().json.booking.phone }}
🦷 الخدمة: {{ $("Normalize Booking Payload").first().json.booking.service }}
👩‍⚕️ الطبيب: {{ $("Normalize Booking Payload").first().json.booking.doctor }}
📅 التاريخ: {{ $("Normalize Booking Payload").first().json.booking.preferred_date }}
⏰ الوقت: {{ $("Normalize Booking Payload").first().json.booking.preferred_time }}
📋 النوع: {{ $("Normalize Booking Payload").first().json.booking.booking_type }}
🩺 ألم: {{ $("Normalize Booking Payload").first().json.booking.has_pain }}

Only activate after Telegram Bot Token and Chat ID are configured.`
      },
      {
        id:     "add_appointment_status_flow",
        title:  "Add appointment status update workflow",
        titleAr:"إضافة تدفق تحديث حالة الموعد",
        urgent: false,
        linkedTask: "add_appointment_status_flow",
        body: `Create a new n8n workflow: "Update Appointment Status"

Trigger: Webhook (POST)
Expected payload:
{
  "appointment_id": "",
  "status": "confirmed | completed | cancelled",
  "updated_by": "admin"
}

Steps:
1. Receive webhook
2. Find matching row in Appointments sheet by appointment_id
3. Update the "status" column in that row
4. If status is "confirmed": send Telegram confirmation to admin
5. Return { success: true, appointment_id, new_status }

Use Google Sheets node: "Update Row" operation.
Keep the webhook URL secure — add to n8n credentials.`
      },
      {
        id:     "add_review_workflow",
        title:  "Add post-visit review workflow",
        titleAr:"إضافة تدفق التقييم بعد الزيارة",
        urgent: false,
        linkedTask: "add_review_workflow",
        body: `Create a new n8n workflow: "Post-Visit Review Request"

Trigger: Schedule (runs every 2 hours)
Steps:
1. Read all rows from Appointments sheet where status = "completed"
   AND review_sent column is empty or false
   AND appointment_date was yesterday or earlier
2. For each matching appointment:
   a. Get patient phone from Patients sheet
   b. Mark review_sent = true in Appointments sheet
   c. (WhatsApp phase) Send review request — SKIP FOR NOW
   d. Send Telegram alert to admin: "طلب تقييم أُرسل لـ [patient_name]"
3. Log total processed count

Note: WhatsApp step is deferred to Phase 5. For now, only mark and notify admin via Telegram.`
      }
    ],

    // ── Claude Code prompts ────────────────────────────────────
    claude: [
      {
        id:     "connect_admin_live_data",
        title:  "Connect admin dashboard to live Google Sheets data",
        titleAr:"ربط لوحة الإدارة ببيانات Google Sheets الحية",
        urgent: false,
        linkedTask: "make_admin_dashboard_dynamic",
        body: `You are the frontend engineer for Ishraqa Dental & Aesthetic Clinic.
Existing file: admin.js

Task: Replace the static MOCK_BOOKINGS array with a real fetch() call.

The n8n endpoint to read appointments will be:
[TO BE CONFIGURED — add to ISHRAQA_CONFIG in config.js as READ_ENDPOINT]

Requirements:
- Add a LOADING state while fetching (show spinner, disable table)
- Add an ERROR state if fetch fails (show retry button + Arabic error message)
- Keep the existing CSV export working with the live data
- Keep the existing search and filter working with the live data
- Keep all existing UI and styles — do not redesign anything
- Do not use email anywhere
- Table columns remain the same

Also add to config.js:
READ_ENDPOINT: "",  // n8n endpoint to read appointments

The fetch should happen on page load and also on the "Refresh" button click.
Show last-fetched timestamp next to the refresh button.`
      },
      {
        id:     "add_patient_registry",
        title:  "Add patient registry page",
        titleAr:"إضافة صفحة سجل المرضى",
        urgent: false,
        linkedTask: "add_patient_registry",
        body: `You are the frontend engineer for Ishraqa Dental & Aesthetic Clinic.

Task: Create a new page patients.html for the patient registry.

Requirements:
- Match the existing design system (style.css, admin.css)
- RTL Arabic-first layout
- Reuse the same sidebar as admin.html
- Show a searchable/filterable table of patients from Google Sheets
- Columns: #, الاسم, الهاتف, العمر, الجنس, عدد الزيارات, آخر زيارة
- Each row should have a "View Bookings" button
- On click: show a side panel (slide-in drawer) with that patient's booking history
- Add pagination (8 per page)
- Add CSV export button
- Data source: fetch from n8n READ_ENDPOINT (same pattern as admin dashboard)
- Do not use email anywhere
- Do not break existing pages`
      },
      {
        id:     "update_booking_payload",
        title:  "Audit and lock booking.js payload",
        titleAr:"مراجعة وتثبيت payload في booking.js",
        urgent: false,
        linkedTask: "stabilize_booking_payload",
        body: `You are the frontend engineer for Ishraqa Dental & Aesthetic Clinic.
Review assets/js/booking.js and verify:

1. The POST payload to n8n uses exactly these snake_case fields:
   source, clinic_name, patient_name, phone, age, gender, doctor,
   service, booking_type, preferred_date, preferred_time,
   has_pain, pain_level, patient_notes, created_at

2. phone is sent exactly as typed (no trimming)
3. pain_level is empty string when has_pain = "no"
4. patient_notes is empty string if not filled — does not block submit
5. Validation only requires: patient_name, phone, service, booking_type,
   preferred_date, preferred_time
6. Dev mode (redirect without POST) only fires when WEBHOOK_URL is the placeholder

Current webhook URL in config.js:
https://great7muntadher.app.n8n.cloud/webhook/booking

Do not change any CSS or HTML. Report only what needs fixing.`
      },
      {
        id:     "add_doctor_schedule_ui",
        title:  "Add doctor schedule management UI",
        titleAr:"إضافة واجهة إدارة جداول الأطباء",
        urgent: false,
        linkedTask: null,
        body: `You are the frontend engineer for Ishraqa Dental & Aesthetic Clinic.

Task: Add a doctor schedule management page (doctors.html) or tab inside admin.html.

Requirements:
- Show each doctor's weekly availability as a grid
- Rows = days (Saturday to Thursday), Columns = time slots (10am–8pm, 30min intervals)
- Admin can click to mark a slot as: Available / Unavailable / Booked
- Data should be saved to localStorage initially (will later connect to Google Sheets)
- RTL Arabic-first layout matching the existing design
- Mobile-friendly
- No email
- Do not break existing pages`
      }
    ],

    // ── ChatGPT prompts ────────────────────────────────────────
    chatgpt: [
      {
        id:     "review_project_state",
        title:  "Review current project state and advise",
        titleAr:"مراجعة الحالة الحالية للمشروع والنصيحة",
        urgent: false,
        linkedTask: null,
        body: `You are the product manager for Ishraqa Dental & Aesthetic Clinic platform.

Current project state:
- Stack: GitHub Pages (Vanilla JS frontend) + n8n Cloud (automation) + Google Sheets (database) + Telegram (alerts)
- Live site: https://greatmuntadher.github.io/Ishraqa_Clinic/index.html
- Current phase: MVP Booking Stabilization

Completed:
- Website booking form is live and sending data to n8n
- n8n workflow receives webhook, normalizes data, and creates rows in Google Sheets
- payload fields are confirmed snake_case

In progress:
- Google Sheets rows are being created but many fields are empty
- Need to fix "Normalize Booking Payload" node references in n8n

Blocked:
- Telegram notifications (waiting for Bot Token and Chat ID)

Please:
1. Review this state and identify any logic gaps
2. Confirm the correct sequence of fixes
3. Flag any risks in the current approach
4. Suggest the exact next 3 actions in priority order`
      },
      {
        id:     "decide_next_phase",
        title:  "Decide when to move to Phase 2 (Telegram alerts)",
        titleAr:"تحديد متى ننتقل إلى المرحلة الثانية",
        urgent: false,
        linkedTask: null,
        body: `You are the product manager for Ishraqa Dental & Aesthetic Clinic platform.

Phase 1 goal: All bookings saved correctly in Google Sheets with full data.
Phase 2 goal: Telegram alerts for each new booking sent to the admin.

Help me define:
1. What exact criteria must be met before we can say Phase 1 is complete?
2. What is the minimum test we should run to confirm the fix worked?
3. What information from the user is blocking Phase 2 that we need to collect?
4. What is the safest sequence: fix Sheets first, then add Telegram — or can they be done in parallel?

Answer in clear, numbered steps.`
      },
      {
        id:     "analyze_n8n_error",
        title:  "Analyze n8n empty rows error",
        titleAr:"تحليل خطأ الصفوف الفارغة في n8n",
        urgent: true,
        linkedTask: "fix_google_sheets_mapping",
        body: `You are the product manager and logic reviewer for a clinic booking platform.

Problem: An n8n workflow receives a booking webhook, normalizes the data in a "Normalize Booking Payload" node, then runs an IF check, then tries to create rows in Google Sheets.

The rows ARE being created but most fields are empty.

Root cause hypothesis:
After the IF node, $json in subsequent nodes may not contain the normalized booking data.
The Sheets nodes may be reading from the wrong context.

Please:
1. Confirm whether this hypothesis is correct based on n8n's data flow rules
2. Explain exactly why $json context changes after an IF node in n8n
3. Write the correct fix: should the Sheets nodes use $("Normalize Booking Payload").first().json.booking.field_name ?
4. Are there edge cases where this approach could also fail?
5. What test case should we run to verify the fix?`
      },
      {
        id:     "define_business_rules",
        title:  "Define business rules for appointment management",
        titleAr:"تحديد قواعد العمل لإدارة المواعيد",
        urgent: false,
        linkedTask: null,
        body: `You are the product manager for Ishraqa Dental & Aesthetic Clinic platform.

Help define the business rules for appointment management:

1. Booking types:
   - "حجز مباشر" (Direct booking): what happens next? Does it auto-confirm?
   - "طلب تأكيد" (Request confirmation): what is the admin's action flow?

2. Appointment lifecycle:
   - What are the valid status transitions? (new → confirmed → completed / cancelled)
   - Who can change status? Admin only? Doctor also?

3. Conflict prevention:
   - How should we handle double-bookings for the same doctor + time slot?
   - Should the website show available slots, or just collect requests?

4. Patient returning logic:
   - How do we identify a returning patient? By phone number?
   - Should a returning patient bypass any steps?

5. Pain triage:
   - If pain_level = 4 or 5, should the system alert admin immediately?

Answer with clear rules I can implement in n8n and the frontend.`
      }
    ]
  };

  // ════════════════════════════════════════════════════════════
  //  STORAGE KEY
  // ════════════════════════════════════════════════════════════
  const STORAGE_KEY = "ishraqa_orchestrator_state";

  // ════════════════════════════════════════════════════════════
  //  STATE MANAGER
  // ════════════════════════════════════════════════════════════
  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with default to pick up any new fields
        return deepMerge(DEFAULT_STATE, parsed);
      }
    } catch (e) {
      console.warn("Orchestrator: could not load state from localStorage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState(state) {
    try {
      state.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Orchestrator: could not save state", e);
    }
  }

  function deepMerge(base, override) {
    const result = JSON.parse(JSON.stringify(base));
    if (!override || typeof override !== "object") return result;

    // Merge tasks by id
    if (Array.isArray(override.tasks)) {
      override.tasks.forEach(t => {
        const existing = result.tasks.find(x => x.id === t.id);
        if (existing) Object.assign(existing, t);
        else result.tasks.push(t);
      });
    }

    // Merge manualInputsNeeded by id
    if (Array.isArray(override.manualInputsNeeded)) {
      override.manualInputsNeeded.forEach(m => {
        const existing = result.manualInputsNeeded.find(x => x.id === m.id);
        if (existing) Object.assign(existing, m);
        else result.manualInputsNeeded.push(m);
      });
    }

    // Merge scalar fields
    ["currentPhase", "lastUpdated"].forEach(k => {
      if (override[k] !== undefined) result[k] = override[k];
    });

    // Merge links
    if (override.links) Object.assign(result.links, override.links);

    return result;
  }

  // ════════════════════════════════════════════════════════════
  //  DERIVED STATS
  // ════════════════════════════════════════════════════════════
  function getStats(state) {
    const tasks = state.tasks;
    return {
      critical:    tasks.filter(t => t.priority === "critical" && t.status !== "completed").length,
      blocked:     tasks.filter(t => t.status === "blocked").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      completed:   tasks.filter(t => t.status === "completed").length,
      pending:     tasks.filter(t => t.status === "pending").length,
      missing_inputs: state.manualInputsNeeded.filter(m => m.status === "missing").length,
      total:       tasks.length,
      progress_pct: Math.round(tasks.filter(t => t.status === "completed").length / tasks.length * 100)
    };
  }

  // ════════════════════════════════════════════════════════════
  //  NEXT BEST ACTION LOGIC
  // ════════════════════════════════════════════════════════════
  function getNextBestAction(state) {
    const tasks = state.tasks;

    // Critical in-progress first
    const critInProgress = tasks.find(t => t.priority === "critical" && t.status === "in_progress");
    if (critInProgress) {
      return {
        type:  "task",
        task:  critInProgress,
        title: "أكمل المهمة الحرجة الجارية",
        desc:  `المهمة "${critInProgress.titleAr}" قيد التنفيذ ويجب إكمالها أولاً لفتح المراحل التالية.`,
        agent: critInProgress.owner,
        prompt_id: critInProgress.id
      };
    }

    // Missing high-priority inputs
    const highInput = state.manualInputsNeeded.find(m => m.priority === "high" && m.status === "missing");
    if (highInput) {
      return {
        type:  "input",
        input: highInput,
        title: `وفّر المعلومة المطلوبة: ${highInput.titleAr}`,
        desc:  `${highInput.descAr} — هذا يعطّل مهام مرتبطة بها.`,
        agent: "user"
      };
    }

    // Critical pending
    const critPending = tasks.find(t => t.priority === "critical" && t.status === "pending");
    if (critPending) {
      return {
        type:  "task",
        task:  critPending,
        title: "ابدأ المهمة الحرجة التالية",
        desc:  `المهمة "${critPending.titleAr}" حرجة وجاهزة للبدء.`,
        agent: critPending.owner,
        prompt_id: critPending.id
      };
    }

    // High priority pending
    const highPending = tasks.find(t => t.priority === "high" && t.status === "pending");
    if (highPending) {
      return {
        type:  "task",
        task:  highPending,
        title: "ابدأ المهمة التالية عالية الأولوية",
        desc:  `المهمة "${highPending.titleAr}" جاهزة للبدء.`,
        agent: highPending.owner,
        prompt_id: highPending.id
      };
    }

    return {
      type:  "done",
      title: "كل المهام مكتملة أو محظورة!",
      desc:  "لا توجد مهام جاهزة حالياً. تحقق من المهام المحظورة ووفّر المعلومات المطلوبة.",
      agent: null
    };
  }

  // ════════════════════════════════════════════════════════════
  //  TELEGRAM ALERT GENERATOR
  // ════════════════════════════════════════════════════════════
  function generateTelegramAlert(input) {
    const priorityMap = { high: "🔴 عالية", medium: "🟡 متوسطة", low: "🟢 منخفضة" };
    return (
`⚠️ مطلوب إجراء يدوي — مشروع عيادة إشراقة
━━━━━━━━━━━━━━━━━━━━━━━━━

📌 المطلوب:
${input.titleAr || input.title}

📝 السبب:
${input.descAr || input.description}

⚡ الأولوية:
${priorityMap[input.priority] || input.priority}

✅ الخطوة التالية:
يرجى توفير هذه المعلومة حتى نكمل المرحلة الحالية من المشروع.

━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 عيادة إشراقة للأسنان والتجميل
📅 ${new Date().toLocaleDateString('ar-IQ')}`
    );
  }

  // ════════════════════════════════════════════════════════════
  //  DOM HELPERS
  // ════════════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  function showToast(msg, icon = "✓") {
    const toast = $("orchToast");
    if (!toast) return;
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "✓ تم النسخ";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = orig; btn.classList.remove("copied"); }, 2000);
      }
      showToast("تم نسخ النص إلى الحافظة", "📋");
    } catch (e) {
      showToast("فشل النسخ — حاول يدوياً", "⚠️");
    }
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER FUNCTIONS
  // ════════════════════════════════════════════════════════════

  // ── Stats ──────────────────────────────────────────────────
  function renderStats(state) {
    const s = getStats(state);
    const grid = $("orchStatsGrid");
    if (!grid) return;

    grid.innerHTML = `
      <div class="orch-stat-card critical">
        <div class="orch-stat-icon">🚨</div>
        <div class="orch-stat-value">${s.critical}</div>
        <div class="orch-stat-label">مهام حرجة</div>
      </div>
      <div class="orch-stat-card high">
        <div class="orch-stat-icon">⏸</div>
        <div class="orch-stat-value">${s.blocked}</div>
        <div class="orch-stat-label">مهام محظورة</div>
      </div>
      <div class="orch-stat-card medium">
        <div class="orch-stat-icon">⚡</div>
        <div class="orch-stat-value">${s.in_progress}</div>
        <div class="orch-stat-label">قيد التنفيذ</div>
      </div>
      <div class="orch-stat-card done">
        <div class="orch-stat-icon">✅</div>
        <div class="orch-stat-value">${s.completed}</div>
        <div class="orch-stat-label">مكتملة</div>
      </div>
    `;

    // Progress bar
    const fill = $("orchProgressFill");
    const label = $("orchProgressLabel");
    if (fill) fill.style.width = s.progress_pct + "%";
    if (label) label.textContent = `${s.progress_pct}%`;
  }

  // ── Next Best Action ───────────────────────────────────────
  function renderNextAction(state) {
    const nba = getNextBestAction(state);
    const container = $("orchNextAction");
    if (!container) return;

    const agentLabels = { claude: "Claude Code", n8n: "n8n AI Agent", chatgpt: "ChatGPT", user: "أنت (المدير)" };
    const agentLabel  = agentLabels[nba.agent] || "";

    let promptBtn = "";
    if (nba.prompt_id) {
      promptBtn = `<button class="orch-btn orch-btn-gold" onclick="orchJumpToPrompt('${nba.agent}','${nba.prompt_id}')">
        عرض الـ Prompt المناسب ←
      </button>`;
    }

    container.innerHTML = `
      <div class="orch-next-action-label">
        ✦ الإجراء التالي الأمثل
        ${agentLabel ? `<span style="margin-inline-start:8px; opacity:0.6;">— ${agentLabel}</span>` : ""}
      </div>
      <div class="orch-next-action-title">${nba.title}</div>
      <div class="orch-next-action-desc">${nba.desc}</div>
      <div class="orch-next-action-buttons">
        ${promptBtn}
        <button class="orch-btn orch-btn-outline" onclick="orchScrollTo('orchTasksSection')">عرض كل المهام</button>
      </div>
    `;
  }

  // ── Tasks ──────────────────────────────────────────────────
  function renderTasks(state) {
    const container = $("orchTaskList");
    if (!container) return;

    container.innerHTML = "";
    state.tasks.forEach(task => {
      const item = el("div", "orch-task-item");
      item.dataset.taskId = task.id;

      const statusIcons = {
        completed:   "✓",
        in_progress: "◉",
        blocked:     "⊘",
        pending:     "○"
      };

      const ownerClass = {
        claude:  "owner-claude",
        n8n:     "owner-n8n",
        chatgpt: "owner-chatgpt",
        user:    "owner-user"
      };

      const ownerLabels = {
        claude:  "Claude Code",
        n8n:     "n8n Agent",
        chatgpt: "ChatGPT",
        user:    "المدير"
      };

      let blockedHtml = "";
      if (task.status === "blocked" && task.blockedBy) {
        blockedHtml = `<div style="font-size:0.72rem; color:#E74C3C; margin-top:4px;">
          محظور بسبب: ${task.blockedBy.join(", ")}
        </div>`;
      }

      item.innerHTML = `
        <div class="orch-task-status status-${task.status}" title="انقر لتغيير الحالة" onclick="orchCycleStatus('${task.id}')">
          ${statusIcons[task.status] || "○"}
        </div>
        <div class="orch-task-content">
          <div class="orch-task-title">${task.titleAr || task.title}</div>
          <div class="orch-task-desc">${task.description || ""}</div>
          ${blockedHtml}
          <div class="orch-task-meta">
            <span class="orch-task-owner ${ownerClass[task.owner] || ''}">${ownerLabels[task.owner] || task.owner}</span>
            <span class="orch-priority-badge priority-${task.priority}">${task.priority}</span>
          </div>
        </div>
        <button class="orch-copy-btn" style="font-size:0.72rem;" onclick="orchSelectTaskPrompt('${task.owner}','${task.id}')">
          الـ Prompt
        </button>
      `;

      container.appendChild(item);
    });
  }

  // ── Manual Inputs ──────────────────────────────────────────
  function renderManualInputs(state) {
    const container = $("orchInputsGrid");
    if (!container) return;

    container.innerHTML = "";
    state.manualInputsNeeded.forEach(inp => {
      const card = el("div", `orch-input-card status-${inp.status}`);
      card.innerHTML = `
        <div class="orch-input-title">
          <span>${inp.titleAr || inp.title}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="orch-priority-badge priority-${inp.priority}">${inp.priority}</span>
            <div class="orch-status-dot ${inp.status}"></div>
          </div>
        </div>
        <div class="orch-input-desc">${inp.descAr || inp.description}</div>
        <input
          type="text"
          class="orch-input-field"
          id="input_${inp.id}"
          placeholder="${inp.status === 'provided' ? 'تم التوفير ✓' : 'أدخل القيمة هنا…'}"
          value="${inp.value || ''}"
        />
        <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
          <button class="orch-input-save-btn" onclick="orchSaveInput('${inp.id}')">💾 حفظ</button>
          <button class="orch-btn orch-btn-ghost" style="font-size:0.72rem; padding:4px 10px;" onclick="orchShowTelegramFor('${inp.id}')">
            📨 توليد رسالة تيليغرام
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ── Prompt Generator ───────────────────────────────────────
  let activeAgent = "n8n";

  function renderPromptTabs() {
    document.querySelectorAll(".orch-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.agent === activeAgent);
    });
  }

  function renderPromptList(state) {
    const container = $("orchPromptList");
    if (!container) return;

    const prompts = PROMPTS[activeAgent] || [];
    container.innerHTML = "";

    prompts.forEach(p => {
      const item = el("div", `orch-prompt-item${p.urgent ? " urgent" : ""}`);
      item.innerHTML = `
        <div class="orch-prompt-info">
          <div class="orch-prompt-title">
            ${p.urgent ? '<span class="urgent-label">⚡ عاجل</span> ' : ""}
            ${p.titleAr || p.title}
          </div>
          <div class="orch-prompt-meta">${p.title}</div>
        </div>
        <button class="orch-copy-btn" id="copyBtn_${p.id}" onclick="orchCopyPrompt('${p.id}',this)">
          📋 نسخ
        </button>
      `;
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("orch-copy-btn")) return;
        $("orchPromptOutput").textContent = p.body;
        document.querySelectorAll(".orch-prompt-item").forEach(x => x.classList.remove("selected"));
        item.classList.add("selected");
      });
      container.appendChild(item);
    });
  }

  function orchCopyPrompt(promptId, btn) {
    const allPrompts = [...PROMPTS.n8n, ...PROMPTS.claude, ...PROMPTS.chatgpt];
    const p = allPrompts.find(x => x.id === promptId);
    if (!p) return;
    $("orchPromptOutput").textContent = p.body;
    copyToClipboard(p.body, btn);
  }
  window.orchCopyPrompt = orchCopyPrompt;

  // ── Jump to prompt by task id ──────────────────────────────
  function orchJumpToPrompt(agent, promptIdOrTaskId) {
    activeAgent = agent;
    renderPromptTabs();
    renderPromptList(currentState);

    // Find by id or linkedTask
    const prompts = PROMPTS[agent] || [];
    const p = prompts.find(x => x.id === promptIdOrTaskId || x.linkedTask === promptIdOrTaskId);
    if (p) {
      $("orchPromptOutput").textContent = p.body;
    }

    orchScrollTo("orchPromptsSection");
  }
  window.orchJumpToPrompt = orchJumpToPrompt;

  function orchSelectTaskPrompt(agent, taskId) {
    orchJumpToPrompt(agent, taskId);
  }
  window.orchSelectTaskPrompt = orchSelectTaskPrompt;

  // ── Telegram section ───────────────────────────────────────
  function renderTelegramSelector(state) {
    const list = $("orchTelegramList");
    if (!list) return;

    list.innerHTML = "";
    state.manualInputsNeeded.filter(m => m.status === "missing").forEach(inp => {
      const item = el("div", "orch-telegram-input-item");
      item.textContent = inp.titleAr || inp.title;
      item.dataset.inputId = inp.id;
      item.addEventListener("click", () => {
        document.querySelectorAll(".orch-telegram-input-item").forEach(x => x.classList.remove("selected"));
        item.classList.add("selected");
        const output = $("orchTelegramOutput");
        if (output) output.textContent = generateTelegramAlert(inp);
      });
      list.appendChild(item);
    });

    if (state.manualInputsNeeded.filter(m => m.status === "missing").length === 0) {
      list.innerHTML = `<div style="font-size:0.82rem; color:rgba(212,196,160,0.3); padding:var(--space-md); text-align:center;">
        ✓ كل المعلومات المطلوبة تم توفيرها
      </div>`;
    }
  }

  function orchShowTelegramFor(inputId) {
    const state = currentState;
    const inp = state.manualInputsNeeded.find(x => x.id === inputId);
    if (!inp) return;
    const output = $("orchTelegramOutput");
    if (output) output.textContent = generateTelegramAlert(inp);
    orchScrollTo("orchTelegramSection");
    // Select in the list
    document.querySelectorAll(".orch-telegram-input-item").forEach(item => {
      item.classList.toggle("selected", item.dataset.inputId === inputId);
    });
  }
  window.orchShowTelegramFor = orchShowTelegramFor;

  // ── Roadmap ────────────────────────────────────────────────
  function renderRoadmap(state) {
    const container = $("orchRoadmap");
    if (!container) return;

    container.innerHTML = "";
    state.roadmap.forEach((phase, i) => {
      const isLast = i === state.roadmap.length - 1;
      const circle = el("div", `orch-phase-circle phase-${phase.status}`);
      circle.textContent = (i + 1).toString();

      const track = el("div", "orch-phase-track");
      track.appendChild(circle);
      if (!isLast) track.appendChild(el("div", "orch-phase-line"));

      const goals = (phase.goalsAr || phase.goals || []).map(g =>
        `<div class="orch-phase-goal">${g}</div>`
      ).join("");

      const content = el("div", "orch-phase-content");
      content.innerHTML = `
        <div class="orch-phase-phase">${phase.phaseAr || phase.phase}</div>
        <div class="orch-phase-title">${phase.titleAr || phase.title}</div>
        <div class="orch-phase-goals">${goals}</div>
      `;

      const item = el("div", "orch-phase-item");
      item.appendChild(track);
      item.appendChild(content);
      container.appendChild(item);
    });
  }

  // ── Workflow Health ────────────────────────────────────────
  function renderWorkflowHealth(state) {
    const container = $("orchHealthGrid");
    if (!container) return;

    const webhookOk = !!(state.links && state.links.liveSite);
    const sheetsOk  = state.tasks.find(t => t.id === "fix_google_sheets_mapping")?.status === "completed";
    const telegramOk = state.manualInputsNeeded.find(m => m.id === "telegram_bot_token")?.status === "provided";

    const items = [
      { icon: "🌐", label: "Webhook الحجز",      status: webhookOk ? "ok" : "warning", text: webhookOk ? "نشط" : "غير محقق" },
      { icon: "📊", label: "Google Sheets",      status: sheetsOk ? "ok" : "warning",  text: sheetsOk  ? "يعمل" : "يحتاج إصلاح" },
      { icon: "📨", label: "تيليغرام",           status: telegramOk ? "ok" : "error",  text: telegramOk ? "مفعّل" : "غير مُعدّ" },
      { icon: "🔗", label: "n8n Workflow",       status: "warning", text: "قيد الإصلاح" },
      { icon: "💾", label: "قاعدة البيانات",    status: "warning", text: "Google Sheets MVP" },
      { icon: "🔒", label: "المصادقة",           status: "unknown", text: "لم تُضف بعد" },
    ];

    container.innerHTML = items.map(it => `
      <div class="orch-health-item">
        <div class="orch-health-icon">${it.icon}</div>
        <div class="orch-health-label">${it.label}</div>
        <div class="orch-health-status health-${it.status}">${it.text}</div>
      </div>
    `).join("");
  }

  // ── Clock ──────────────────────────────────────────────────
  function startClock() {
    const el = $("orchClock");
    if (!el) return;
    const update = () => {
      el.textContent = new Date().toLocaleTimeString("ar-IQ");
    };
    update();
    setInterval(update, 1000);
  }

  // ── Scroll helper ──────────────────────────────────────────
  function orchScrollTo(id) {
    const el = $(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.orchScrollTo = orchScrollTo;

  // ════════════════════════════════════════════════════════════
  //  TASK STATUS CYCLE
  // ════════════════════════════════════════════════════════════
  const STATUS_CYCLE = ["pending", "in_progress", "completed", "blocked"];

  function orchCycleStatus(taskId) {
    const task = currentState.tasks.find(t => t.id === taskId);
    if (!task) return;
    const idx  = STATUS_CYCLE.indexOf(task.status);
    task.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    saveState(currentState);
    renderAll(currentState);
    showToast(`حالة المهمة: ${task.status}`, "🔄");
  }
  window.orchCycleStatus = orchCycleStatus;

  // ════════════════════════════════════════════════════════════
  //  SAVE MANUAL INPUT
  // ════════════════════════════════════════════════════════════
  function orchSaveInput(inputId) {
    const inp = currentState.manualInputsNeeded.find(x => x.id === inputId);
    if (!inp) return;
    const field = $(`input_${inputId}`);
    const val = field ? field.value.trim() : "";

    // Security warning: do not store actual secrets in localStorage
    if (inputId === "telegram_bot_token" && val && val.length > 10) {
      if (!confirm("⚠️ تحذير: لا ينبغي تخزين Bot Token في المتصفح. \n\nقم بتخزينه في n8n Credentials بدلاً من ذلك.\n\nهل تريد الاستمرار فقط للاختبار؟")) {
        return;
      }
    }

    inp.value  = val;
    inp.status = val ? "provided" : "missing";
    saveState(currentState);
    renderAll(currentState);
    showToast(val ? `تم حفظ: ${inp.titleAr}` : `تم مسح: ${inp.titleAr}`, val ? "✓" : "○");
  }
  window.orchSaveInput = orchSaveInput;

  // ════════════════════════════════════════════════════════════
  //  EXPORT / IMPORT
  // ════════════════════════════════════════════════════════════
  function exportState() {
    const exportable = JSON.parse(JSON.stringify(currentState));
    // Strip sensitive values before export
    exportable.manualInputsNeeded.forEach(m => {
      if (m.id === "telegram_bot_token") m.value = "[REDACTED]";
    });

    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `ishraqa-orchestrator-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("تم تصدير الحالة كـ JSON", "📥");
  }
  window.orchExportState = exportState;

  function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        currentState = deepMerge(DEFAULT_STATE, parsed);
        saveState(currentState);
        renderAll(currentState);
        showToast("تم استيراد الحالة بنجاح", "📤");
      } catch (err) {
        showToast("خطأ: ملف JSON غير صالح", "⚠️");
      }
    };
    reader.readAsText(file);
  }
  window.orchImportTrigger = () => $("importFileInput")?.click();

  function resetState() {
    if (!confirm("هل تريد إعادة ضبط الحالة إلى الافتراضي؟ سيتم حذف كل التعديلات.")) return;
    currentState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState(currentState);
    renderAll(currentState);
    showToast("تم إعادة الضبط", "🔄");
  }
  window.orchResetState = resetState;

  // ════════════════════════════════════════════════════════════
  //  SIDEBAR TOGGLE
  // ════════════════════════════════════════════════════════════
  function bindSidebarToggle() {
    const btn     = $("orchSidebarToggle");
    const sidebar = $("orchSidebar");
    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 860 && !sidebar.contains(e.target) && e.target !== btn) {
        sidebar.classList.remove("open");
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  PROMPT TAB SWITCHING
  // ════════════════════════════════════════════════════════════
  function bindPromptTabs() {
    document.querySelectorAll(".orch-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeAgent = btn.dataset.agent;
        renderPromptTabs();
        renderPromptList(currentState);
        $("orchPromptOutput").textContent = "";
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  //  COPY TELEGRAM DRAFT
  // ════════════════════════════════════════════════════════════
  function bindTelegramCopy() {
    const btn = $("orchTelegramCopyBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const text = $("orchTelegramOutput")?.textContent || "";
      if (!text.trim()) { showToast("اختر معلومة أولاً", "⚠️"); return; }
      copyToClipboard(text, btn);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  COPY PROMPT OUTPUT BOX
  // ════════════════════════════════════════════════════════════
  function bindPromptOutputCopy() {
    const btn = $("orchPromptCopyAllBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const text = $("orchPromptOutput")?.textContent || "";
      if (!text.trim()) { showToast("اختر prompt أولاً", "⚠️"); return; }
      copyToClipboard(text, btn);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  FILE IMPORT BINDING
  // ════════════════════════════════════════════════════════════
  function bindImport() {
    const input = $("importFileInput");
    if (!input) return;
    input.addEventListener("change", (e) => {
      if (e.target.files[0]) importState(e.target.files[0]);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER ALL
  // ════════════════════════════════════════════════════════════
  function renderAll(state) {
    renderStats(state);
    renderNextAction(state);
    renderTasks(state);
    renderManualInputs(state);
    renderTelegramSelector(state);
    renderRoadmap(state);
    renderWorkflowHealth(state);
    renderPromptTabs();
    renderPromptList(state);

    // Last updated
    const lu = $("orchLastUpdated");
    if (lu && state.lastUpdated) {
      lu.textContent = "آخر تحديث: " + new Date(state.lastUpdated).toLocaleString("ar-IQ");
    }

    // Phase
    const phase = $("orchCurrentPhase");
    if (phase) phase.textContent = state.currentPhase;
  }

  // ════════════════════════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════════════════════════
  let currentState;

  function init() {
    currentState = loadState();

    renderAll(currentState);
    bindSidebarToggle();
    bindPromptTabs();
    bindTelegramCopy();
    bindPromptOutputCopy();
    bindImport();
    startClock();

    // Save initial state if first run
    saveState(currentState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
