/**
 * ============================================================
 *  Ishraqa Clinic — Admin Dashboard Logic
 *  عيادة إشراقة — منطق لوحة الإدارة
 * ============================================================
 *
 *  MVP: Uses static mock data.
 *  To connect to Google Sheets or n8n, replace the
 *  `loadDashboardData()` function with a real API call.
 * ============================================================
 */

(function () {
  "use strict";

  // ── Mock Data (replace with API call later) ──────────────────
  // TODO: Replace loadDashboardData() with fetch to your n8n/Sheets endpoint
  const MOCK_BOOKINGS = [
    { id: "ISH-001", name: "سارة أحمد الموسوي",   phone: "07801234567", service: "فحص واستشارة",  doctor: "د. منار",  date: "2025-06-15", time: "10:00", type: "حجز مباشر", status: "confirmed", hasPain: "لا",  painLevel: "" },
    { id: "ISH-002", name: "محمد علي الكعبي",      phone: "07701234568", service: "تنظيف الأسنان",  doctor: "د. زهراء", date: "2025-06-15", time: "11:30", type: "طلب تأكيد", status: "new",       hasPain: "نعم", painLevel: "3" },
    { id: "ISH-003", name: "نور حسين الزيدي",     phone: "07801234569", service: "تبييض الأسنان",  doctor: "د. منار",  date: "2025-06-16", time: "14:00", type: "حجز مباشر", status: "confirmed", hasPain: "لا",  painLevel: "" },
    { id: "ISH-004", name: "فاطمة جابر المهداوي", phone: "07701234570", service: "نفخ الشفاه",     doctor: "د. زهراء", date: "2025-06-16", time: "16:00", type: "حجز مباشر", status: "completed", hasPain: "لا",  painLevel: "" },
    { id: "ISH-005", name: "علي حسن الشمري",      phone: "07801234571", service: "قلع الأسنان",    doctor: "د. منار",  date: "2025-06-17", time: "10:30", type: "طلب تأكيد", status: "pending",   hasPain: "نعم", painLevel: "5" },
    { id: "ISH-006", name: "زينب كريم العبادي",   phone: "07701234572", service: "تحشية الأسنان",  doctor: "د. زهراء", date: "2025-06-17", time: "15:00", type: "حجز مباشر", status: "new",       hasPain: "نعم", painLevel: "2" },
    { id: "ISH-007", name: "حيدر عباس الربيعي",   phone: "07801234573", service: "بوتوكس",         doctor: "د. منار",  date: "2025-06-18", time: "11:00", type: "طلب تأكيد", status: "confirmed", hasPain: "لا",  painLevel: "" },
    { id: "ISH-008", name: "أمل ياسين القريشي",   phone: "07701234574", service: "تجميل",          doctor: "د. زهراء", date: "2025-06-18", time: "17:00", type: "حجز مباشر", status: "new",       hasPain: "لا",  painLevel: "" },
    { id: "ISH-009", name: "مصطفى طارق الجبوري",  phone: "07801234575", service: "فحص واستشارة",  doctor: "بدون تفضيل", date: "2025-06-19", time: "10:00", type: "طلب تأكيد", status: "pending",hasPain: "نعم", painLevel: "4" },
    { id: "ISH-010", name: "رنا محمود الساعدي",   phone: "07701234576", service: "تبييض الأسنان",  doctor: "د. منار",  date: "2025-06-20", time: "14:30", type: "حجز مباشر", status: "new",       hasPain: "لا",  painLevel: "" },
    { id: "ISH-011", name: "يوسف عبد الله الدليمي",phone:"07801234577", service: "تنظيف الأسنان", doctor: "د. زهراء", date: "2025-06-20", time: "16:00", type: "حجز مباشر", status: "completed", hasPain: "لا",  painLevel: "" },
    { id: "ISH-012", name: "هناء كامل الحسيني",   phone: "07701234578", service: "نفخ الشفاه",     doctor: "د. منار",  date: "2025-06-21", time: "11:30", type: "طلب تأكيد", status: "confirmed", hasPain: "لا",  painLevel: "" },
  ];

  // ── State ─────────────────────────────────────────────────────
  let allBookings     = [...MOCK_BOOKINGS];
  let filteredBookings = [...MOCK_BOOKINGS];
  let currentPage     = 1;
  const PAGE_SIZE     = 8;

  // ── DOM Helpers ───────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  // ── Date display ──────────────────────────────────────────────
  function setTopbarDate() {
    const el = $('topbarDate');
    if (!el) return;
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('ar-IQ', opts);
  }

  // ── Stats Cards ───────────────────────────────────────────────
  function updateStats() {
    const newCount       = allBookings.filter(b => b.status === 'new').length;
    const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
    const completedCount = allBookings.filter(b => b.status === 'completed').length;
    const returningCount = Math.floor(allBookings.length * 0.4); // mock returning %

    animateCounter('statNewBookings', newCount);
    animateCounter('statConfirmed', confirmedCount);
    animateCounter('statCompleted', completedCount);
    animateCounter('statReturning', returningCount);
  }

  function animateCounter(id, target) {
    const el = $(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 20);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 40);
  }

  // ── Status Badge ──────────────────────────────────────────────
  function statusBadge(status) {
    const map = {
      new:       { cls: 'badge-new',       label: 'جديد'   },
      confirmed: { cls: 'badge-confirmed', label: 'مؤكد'   },
      completed: { cls: 'badge-completed', label: 'مكتمل'  },
      pending:   { cls: 'badge-pending',   label: 'معلق'   },
      cancelled: { cls: 'badge-cancelled', label: 'ملغى'   },
    };
    const s = map[status] || { cls: 'badge-new', label: status };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  }

  // ── Booking Type Badge ────────────────────────────────────────
  function typeBadge(type) {
    if (type.includes('مباشر')) return `<span style="font-size:0.78rem; color:var(--success);">✅ مباشر</span>`;
    return `<span style="font-size:0.78rem; color:#D4AC0D;">📞 طلب</span>`;
  }

  // ── Action Buttons ────────────────────────────────────────────
  function actionButtons(booking) {
    const btns = [];
    if (booking.status === 'new' || booking.status === 'pending') {
      btns.push(`<button class="action-btn action-confirm" onclick="confirmBooking('${booking.id}')">تأكيد</button>`);
    }
    if (booking.status === 'confirmed') {
      btns.push(`<button class="action-btn action-complete" onclick="completeBooking('${booking.id}')">اكتمل</button>`);
    }
    btns.push(`<button class="action-btn action-view" onclick="viewBooking('${booking.id}')">عرض</button>`);
    return `<div style="display:flex;gap:4px;flex-wrap:wrap;">${btns.join('')}</div>`;
  }

  // ── Render Table ──────────────────────────────────────────────
  function renderTable() {
    const tbody   = $('bookingsBody');
    const countEl = $('tableCount');
    if (!tbody) return;

    const total = filteredBookings.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, total);
    const page  = filteredBookings.slice(start, end);

    if (countEl) {
      countEl.textContent = `عرض ${start + 1}–${end} من ${total} حجز`;
    }

    if (page.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2rem; color:var(--muted);">
            لا توجد حجوزات مطابقة للبحث
          </td>
        </tr>
      `;
      renderPagination(total);
      return;
    }

    tbody.innerHTML = page.map((b, i) => `
      <tr>
        <td style="color:var(--muted); font-size:0.78rem;">${b.id}</td>
        <td>
          <div style="font-weight:600; color:var(--dark);">${b.name}</div>
          ${b.hasPain === 'نعم' ? `<div style="font-size:0.72rem; color:var(--error);">⚠ ألم ${b.painLevel ? `(${b.painLevel}/5)` : ''}</div>` : ''}
        </td>
        <td dir="ltr" style="font-size:0.82rem;">${b.phone}</td>
        <td>${b.service}</td>
        <td>${b.doctor}</td>
        <td>
          <div style="font-size:0.85rem;">${b.date}</div>
          <div style="font-size:0.78rem; color:var(--muted);">${b.time}</div>
        </td>
        <td>${typeBadge(b.type)}</td>
        <td>${statusBadge(b.status)}</td>
        <td>${actionButtons(b)}</td>
      </tr>
    `).join('');

    renderPagination(total);
  }

  // ── Pagination ────────────────────────────────────────────────
  function renderPagination(total) {
    const pages  = Math.ceil(total / PAGE_SIZE);
    const pagEl  = $('pagination');
    if (!pagEl) return;

    if (pages <= 1) { pagEl.innerHTML = ''; return; }

    let html = '';
    if (currentPage > 1) {
      html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">›</button>`;
    }
    for (let p = 1; p <= pages; p++) {
      html += `<button class="page-btn ${p === currentPage ? 'current' : ''}" onclick="goPage(${p})">${p}</button>`;
    }
    if (currentPage < pages) {
      html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">‹</button>`;
    }
    pagEl.innerHTML = html;
  }

  window.goPage = function (page) {
    currentPage = page;
    renderTable();
  };

  // ── Booking Actions ───────────────────────────────────────────
  window.confirmBooking = function (id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    b.status = 'confirmed';
    filteredBookings = [...allBookings]; // refresh
    applyFilters();
    updateStats();
    console.log(`✅ Booking ${id} confirmed`);
  };

  window.completeBooking = function (id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    b.status = 'completed';
    filteredBookings = [...allBookings];
    applyFilters();
    updateStats();
    console.log(`🏥 Booking ${id} completed`);
  };

  window.viewBooking = function (id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    alert(
      `📋 تفاصيل الحجز ${b.id}\n\n` +
      `الاسم: ${b.name}\n` +
      `الهاتف: ${b.phone}\n` +
      `الخدمة: ${b.service}\n` +
      `الطبيب: ${b.doctor}\n` +
      `التاريخ: ${b.date} الساعة ${b.time}\n` +
      `الحالة: ${b.status}\n` +
      `ألم: ${b.hasPain}${b.painLevel ? ` (${b.painLevel}/5)` : ''}`
    );
  };

  // ── Filter / Search ───────────────────────────────────────────
  function applyFilters() {
    const searchVal  = ($('tableSearch')  || {}).value  || '';
    const statusVal  = ($('statusFilter') || {}).value  || '';

    filteredBookings = allBookings.filter(b => {
      const matchSearch = !searchVal
        || b.name.includes(searchVal)
        || b.phone.includes(searchVal)
        || b.service.includes(searchVal)
        || b.id.includes(searchVal);
      const matchStatus = !statusVal || b.status === statusVal;
      return matchSearch && matchStatus;
    });

    currentPage = 1;
    renderTable();
  }

  // ── Week Chart ────────────────────────────────────────────────
  function renderWeekChart() {
    const el = $('weekChart');
    if (!el) return;

    const days = [
      { label: 'السبت', count: 2 },
      { label: 'الأحد', count: 4 },
      { label: 'الاثنين', count: 1 },
      { label: 'الثلاثاء', count: 3 },
      { label: 'الأربعاء', count: 2 },
      { label: 'الخميس', count: 5 },
    ];

    const max = Math.max(...days.map(d => d.count));

    el.innerHTML = days.map(d => {
      const pct = Math.round((d.count / max) * 85) + 5;
      return `
        <div class="chart-bar-wrap">
          <div class="chart-bar-val">${d.count}</div>
          <div class="chart-bar" style="height:${pct}%; min-height:4px;" title="${d.label}: ${d.count} حجوزات"></div>
          <div class="chart-bar-label">${d.label.substring(0, 3)}</div>
        </div>
      `;
    }).join('');
  }

  // ── Services Ranking ──────────────────────────────────────────
  function renderServicesRanking() {
    const el = $('servicesRanking');
    if (!el) return;

    // Count services
    const counts = {};
    allBookings.forEach(b => {
      counts[b.service] = (counts[b.service] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    el.innerHTML = sorted.map(([service, count], i) => `
      <div class="rank-item">
        <div class="rank-num">${i + 1}</div>
        <div class="rank-label">${service}</div>
        <div class="rank-count">${count} طلب</div>
      </div>
    `).join('');
  }

  // ── Webhook Status Check ──────────────────────────────────────
  function checkWebhookStatus() {
    const dot  = $('wsDot');
    const text = $('wsText');
    if (!dot || !text) return;

    const url = ISHRAQA_CONFIG.WEBHOOK_URL;
    if (!url || url.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
      dot.classList.add('inactive');
      text.textContent = 'غير مُعدَّل بعد';
      text.style.color = 'var(--error)';
    } else {
      dot.classList.add('active');
      text.textContent = 'مُفعَّل';
      text.style.color = 'var(--success)';
    }
  }

  // ── Sidebar navigation ────────────────────────────────────────
  function bindSidebarNav() {
    const links = document.querySelectorAll('.sidebar-link[data-section]');
    const secEl = $('currentSection');

    const sectionNames = {
      overview:  'نظرة عامة',
      bookings:  'الحجوزات',
      patients:  'المرضى',
      doctors:   'الأطباء',
      settings:  'الإعدادات',
    };

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const sec = link.dataset.section;
        if (secEl) secEl.textContent = sectionNames[sec] || sec;
      });
    });
  }

  // ── Mobile sidebar toggle ─────────────────────────────────────
  function bindSidebarToggle() {
    const btn     = $('sidebarToggle');
    const sidebar = $('adminSidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && e.target !== btn) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ── Export CSV ────────────────────────────────────────────────
  window.exportCSV = function () {
    const headers = ['رقم الحجز', 'الاسم', 'الهاتف', 'الخدمة', 'الطبيب', 'التاريخ', 'الوقت', 'النوع', 'الحالة', 'ألم', 'مستوى الألم'];
    const rows    = allBookings.map(b => [
      b.id, b.name, b.phone, b.service, b.doctor,
      b.date, b.time, b.type, b.status, b.hasPain, b.painLevel
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom  = '\uFEFF'; // UTF-8 BOM for Arabic Excel support
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ishraqa-bookings-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print ─────────────────────────────────────────────────────
  window.printView = function () {
    window.print();
  };

  // ── Refresh (mock) ────────────────────────────────────────────
  window.refreshData = function () {
    const btn = event && event.target;
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span class="qa-icon">⏳</span><span>جارٍ التحديث…</span>';
      btn.style.opacity = '0.6';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.opacity = '1';
        console.log('💡 Data refreshed — connect real API to fetch live data');
        // TODO: fetch from n8n or Google Sheets and call renderTable()
      }, 1200);
    }
  };

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    setTopbarDate();
    updateStats();
    renderTable();
    renderWeekChart();
    renderServicesRanking();
    checkWebhookStatus();
    bindSidebarNav();
    bindSidebarToggle();

    // Bind search & filter
    const searchEl = $('tableSearch');
    const filterEl = $('statusFilter');
    if (searchEl) searchEl.addEventListener('input', applyFilters);
    if (filterEl) filterEl.addEventListener('change', applyFilters);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
