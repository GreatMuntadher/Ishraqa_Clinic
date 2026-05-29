/**
 * ============================================================
 *  Ishraqa Clinic — Booking Form Logic
 *  عيادة إشراقة — منطق نموذج الحجز
 * ============================================================
 */

(function () {
  "use strict";

  // ── DOM References ─────────────────────────────────────────
  const form          = document.getElementById("bookingForm");
  const submitBtn     = document.getElementById("submitBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const errorAlert    = document.getElementById("errorAlert");
  const errorMessage  = document.getElementById("errorMessage");
  const hasPainYes    = document.getElementById("hasPainYes");
  const hasPainNo     = document.getElementById("hasPainNo");
  const painLevelRow  = document.getElementById("painLevelRow");
  const painSlider    = document.getElementById("painLevel");
  const painDisplay   = document.getElementById("painDisplay");
  const bookingTypeSelect = document.getElementById("bookingType");

  // ── Read URL param for pre-selected doctor ─────────────────
  function preselectFromURL() {
    const params = new URLSearchParams(window.location.search);
    const doctor = params.get("doctor");
    if (doctor) {
      const radioEl = document.querySelector(`input[name="doctor"][value="${doctor}"]`);
      if (radioEl) radioEl.checked = true;
    }
  }

  // ── Populate selects from config ───────────────────────────
  function populateServicesSelect() {
    const select = document.getElementById("service");
    if (!select) return;
    ISHRAQA_CONFIG.SERVICES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      select.appendChild(opt);
    });
  }

  // ── Pain level toggle ──────────────────────────────────────
  function bindPainToggle() {
    function updatePainRow() {
      const show = hasPainYes && hasPainYes.checked;
      if (painLevelRow) {
        painLevelRow.style.display = show ? "flex" : "none";
        painLevelRow.style.flexDirection = "column";
        painLevelRow.style.gap = "6px";
      }
    }

    if (hasPainYes) hasPainYes.addEventListener("change", updatePainRow);
    if (hasPainNo)  hasPainNo.addEventListener("change", updatePainRow);
    updatePainRow(); // initial state
  }

  // ── Pain slider live value ─────────────────────────────────
  function bindPainSlider() {
    if (!painSlider || !painDisplay) return;
    const labels = ["", "خفيف 😊", "بسيط 🙂", "متوسط 😐", "شديد 😟", "شديد جداً 😣"];
    painSlider.addEventListener("input", () => {
      const val = painSlider.value;
      painDisplay.textContent = `${val} — ${labels[val] || ""}`;
    });
    // Set initial
    painDisplay.textContent = `${painSlider.value} — ${labels[painSlider.value]}`;
  }

  // ── Validation ─────────────────────────────────────────────
  const REQUIRED_FIELDS = [
    { id: "patientName",   msg: "الرجاء إدخال الاسم الكامل"       },
    { id: "phone",         msg: "رقم الهاتف مطلوب"                 },
    { id: "age",           msg: "الرجاء إدخال العمر"               },
    { id: "service",       msg: "الرجاء اختيار الخدمة"             },
    { id: "preferredDate", msg: "الرجاء اختيار التاريخ المفضل"     },
    { id: "preferredTime", msg: "الرجاء اختيار الوقت المفضل"       },
    { id: "bookingType",   msg: "الرجاء اختيار نوع الحجز"          },
  ];

  function validateField(fieldId, msg) {
    const el    = document.getElementById(fieldId);
    const group = el ? el.closest(".form-group") : null;
    if (!el || !group) return true;

    const val = el.value.trim();
    if (!val) {
      group.classList.add("has-error");
      const errEl = group.querySelector(".form-error");
      if (errEl) errEl.textContent = msg;
      return false;
    } else {
      group.classList.remove("has-error");
      return true;
    }
  }

  function validatePhone() {
    const el    = document.getElementById("phone");
    const group = el ? el.closest(".form-group") : null;
    if (!el || !group) return true;

    const val = el.value.trim().replace(/\s/g, "");
    const valid = /^[\d\+\-\(\)]{7,15}$/.test(val);
    if (!valid) {
      group.classList.add("has-error");
      const errEl = group.querySelector(".form-error");
      if (errEl) errEl.textContent = "رقم الهاتف غير صحيح";
      return false;
    }
    group.classList.remove("has-error");
    return true;
  }

  function validateRadioGroup(name, groupId, msg) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    const group   = document.getElementById(groupId);
    if (!group) return true;
    const errEl   = group.querySelector(".form-error");

    if (!checked) {
      group.classList.add("has-error");
      if (errEl) errEl.textContent = msg;
      return false;
    }
    group.classList.remove("has-error");
    return true;
  }

  function validateForm() {
    let valid = true;

    REQUIRED_FIELDS.forEach(({ id, msg }) => {
      if (!validateField(id, msg)) valid = false;
    });

    // Phone extra validation
    const phoneField = document.getElementById("phone");
    if (phoneField && phoneField.value.trim()) {
      if (!validatePhone()) valid = false;
    }

    // Gender radio
    if (!validateRadioGroup("gender", "genderGroup", "الرجاء اختيار الجنس")) valid = false;

    // Doctor radio
    if (!validateRadioGroup("doctor", "doctorGroup", "الرجاء اختيار الطبيب أو بدون تفضيل")) valid = false;

    return valid;
  }

  // ── Clear error on input ───────────────────────────────────
  function bindClearErrors() {
    document.querySelectorAll(".form-control").forEach((el) => {
      el.addEventListener("input", () => {
        const group = el.closest(".form-group");
        if (group) group.classList.remove("has-error");
      });
      el.addEventListener("change", () => {
        const group = el.closest(".form-group");
        if (group) group.classList.remove("has-error");
      });
    });

    document.querySelectorAll("input[type='radio']").forEach((el) => {
      el.addEventListener("change", () => {
        const group = el.closest(".radio-group-wrapper");
        if (group) group.classList.remove("has-error");
      });
    });
  }

  // ── Build payload ──────────────────────────────────────────
  function buildPayload() {
    const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    };

    const hasPain     = getRadio("hasPain");
    const painLevelEl = document.getElementById("painLevel");
    const painLevel   = hasPain === "yes" && painLevelEl ? painLevelEl.value : "";

    // Map doctor id to display label
    const doctorId  = getRadio("doctor");
    const doctorObj = ISHRAQA_CONFIG.DOCTORS.find((d) => d.id === doctorId);
    const doctorLabel = doctorObj ? `${doctorObj.label_en} / ${doctorObj.label}` : doctorId;

    // Map service id to label
    const serviceId  = getValue("service");
    const serviceObj = ISHRAQA_CONFIG.SERVICES.find((s) => s.id === serviceId);
    const serviceLabel = serviceObj ? serviceObj.label : serviceId;

    // Map booking type
    const bookingTypeMap = { direct: "حجز مباشر", request: "طلب تأكيد" };
    const bookingTypeVal  = getValue("bookingType");
    const bookingTypeLabel = bookingTypeMap[bookingTypeVal] || bookingTypeVal;

    // Gender
    const genderMap = { male: "ذكر", female: "أنثى" };
    const genderVal  = getRadio("gender");
    const genderLabel = genderMap[genderVal] || genderVal;

    return {
      source:         ISHRAQA_CONFIG.SOURCE,
      clinic_name:    ISHRAQA_CONFIG.CLINIC_NAME,
      patient_name:   getValue("patientName"),
      phone:          getValue("phone"),
      age:            getValue("age"),
      gender:         genderLabel,
      doctor:         doctorLabel,
      service:        serviceLabel,
      booking_type:   bookingTypeLabel,
      preferred_date: getValue("preferredDate"),
      preferred_time: getValue("preferredTime"),
      has_pain:       hasPain === "yes" ? "نعم" : "لا",
      pain_level:     painLevel,
      patient_notes:  getValue("patientNotes"),
      created_at:     new Date().toISOString(),
    };
  }

  // ── Submit to webhook ──────────────────────────────────────
  async function submitBooking(payload) {
    const webhookURL = ISHRAQA_CONFIG.WEBHOOK_URL;

    if (!webhookURL || webhookURL.includes("YOUR_N8N_WEBHOOK_URL_HERE")) {
      throw new Error("webhook_not_configured");
    }

    const response = await fetch(webhookURL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    return response;
  }

  // ── UI helpers ─────────────────────────────────────────────
  function setLoading(state) {
    if (loadingOverlay) loadingOverlay.classList.toggle("active", state);
    if (submitBtn) {
      submitBtn.classList.toggle("loading", state);
      submitBtn.disabled = state;
    }
  }

  function showError(msg) {
    if (!errorAlert || !errorMessage) return;
    errorMessage.textContent = msg;
    errorAlert.style.display = "flex";
    errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideError() {
    if (errorAlert) errorAlert.style.display = "none";
  }

  // ── Redirect to thank you ──────────────────────────────────
  function redirectThankYou(payload) {
    const params = new URLSearchParams({
      name:    payload.patient_name,
      service: payload.service,
      date:    payload.preferred_date,
      time:    payload.preferred_time,
      type:    payload.booking_type,
    });
    window.location.href = `thankyou.html?${params.toString()}`;
  }

  // ── Form submit handler ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    hideError();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = form.querySelector(".has-error");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload();

    setLoading(true);

    try {
      await submitBooking(payload);
      redirectThankYou(payload);
    } catch (err) {
      setLoading(false);

      if (err.message === "webhook_not_configured") {
        // Dev mode: still redirect for testing UI
        console.warn("⚠️ Webhook not configured — redirecting anyway (dev mode)");
        console.log("📦 Booking payload:", payload);
        redirectThankYou(payload);
      } else if (err.message.startsWith("HTTP_")) {
        showError(`حدث خطأ في الإرسال (${err.message}). الرجاء المحاولة مرة أخرى أو التواصل معنا مباشرة.`);
      } else {
        showError("تعذّر الاتصال بالخادم. الرجاء التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
      }
    }
  }

  // ── Set min date to today ──────────────────────────────────
  function setMinDate() {
    const dateInput = document.getElementById("preferredDate");
    if (!dateInput) return;
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min", today);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (!form) return;

    populateServicesSelect();
    preselectFromURL();
    bindPainToggle();
    bindPainSlider();
    bindClearErrors();
    setMinDate();

    form.addEventListener("submit", handleSubmit);
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
