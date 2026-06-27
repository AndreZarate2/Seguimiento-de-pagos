const CONFIG = {
  supabaseUrl: "https://hqrofbtrbylvuxtvfokr.supabase.co",
  restUrl: "https://hqrofbtrbylvuxtvfokr.supabase.co/rest/v1",
  publishableKey: "sb_publishable_6HbD2CnWrtRcirluJ1auyg_A-d1NG3r",
  adminEmail: "andrezarate1234@gmail.com",
  tableName: "payment_installments",
  bucketName: "payment-receipts",
  totalAmount: 5420.64,
  monthlyAmount: 451.72,
  months: 12,
  firstDueDate: "2026-07-02"
};

const STORAGE_KEY = "andre_payment_dashboard_session";

const state = {
  session: null,
  payments: buildDefaultPayments(),
  selectedFile: null,
  previewUrl: null,
  isLoading: false,
  search: ""
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  restoreSession();
  populateMonthSelect();
  fillFormFromMonth(1);
  render();
  loadPayments();
});

function bindElements() {
  els.connectionStatus = document.getElementById("connectionStatus");
  els.refreshBtn = document.getElementById("refreshBtn");
  els.adminToggleBtn = document.getElementById("adminToggleBtn");
  els.adminToggleLabel = document.getElementById("adminToggleLabel");
  els.logoutBtn = document.getElementById("logoutBtn");
  els.adminPanel = document.getElementById("adminPanel");
  els.contentGrid = document.getElementById("contentGrid");
  els.adminIdentity = document.getElementById("adminIdentity");
  els.searchInput = document.getElementById("searchInput");
  els.paymentRows = document.getElementById("paymentRows");
  els.tableSummary = document.getElementById("tableSummary");
  els.totalAmount = document.getElementById("totalAmount");
  els.paidAmount = document.getElementById("paidAmount");
  els.remainingAmount = document.getElementById("remainingAmount");
  els.extraAmount = document.getElementById("extraAmount");
  els.paidMonths = document.getElementById("paidMonths");
  els.nextPayment = document.getElementById("nextPayment");
  els.lastPayment = document.getElementById("lastPayment");
  els.progressPercent = document.getElementById("progressPercent");
  els.progressBar = document.getElementById("progressBar");
  els.monthSelect = document.getElementById("monthSelect");
  els.paidInput = document.getElementById("paidInput");
  els.paidDateInput = document.getElementById("paidDateInput");
  els.dueDateInput = document.getElementById("dueDateInput");
  els.notesInput = document.getElementById("notesInput");
  els.receiptFile = document.getElementById("receiptFile");
  els.receiptPreview = document.getElementById("receiptPreview");
  els.adminForm = document.getElementById("adminForm");
  els.resetFormBtn = document.getElementById("resetFormBtn");
  els.savePaymentBtn = document.getElementById("savePaymentBtn");
  els.loginDialog = document.getElementById("loginDialog");
  els.loginForm = document.getElementById("loginForm");
  els.closeLoginBtn = document.getElementById("closeLoginBtn");
  els.loginSubmitBtn = document.getElementById("loginSubmitBtn");
  els.emailInput = document.getElementById("emailInput");
  els.passwordInput = document.getElementById("passwordInput");
  els.receiptDialog = document.getElementById("receiptDialog");
  els.closeReceiptBtn = document.getElementById("closeReceiptBtn");
  els.receiptImage = document.getElementById("receiptImage");
  els.receiptMonth = document.getElementById("receiptMonth");
  els.receiptTitle = document.getElementById("receiptTitle");
  els.receiptDetails = document.getElementById("receiptDetails");
  els.toast = document.getElementById("toast");
  els.sideStatusLabel = document.getElementById("sideStatusLabel");
  els.sideProgressBar = document.getElementById("sideProgressBar");
  els.paymentLineChart = document.getElementById("paymentLineChart");
  els.monthlyBars = document.getElementById("monthlyBars");
  els.donutChart = document.getElementById("donutChart");
  els.donutPercent = document.getElementById("donutPercent");
  els.chartPaid = document.getElementById("chartPaid");
  els.chartPending = document.getElementById("chartPending");
  els.chartExtra = document.getElementById("chartExtra");
  els.chartAverage = document.getElementById("chartAverage");
  els.chartCounts = document.getElementById("chartCounts");
}

function bindEvents() {
  els.refreshBtn.addEventListener("click", loadPayments);
  els.adminToggleBtn.addEventListener("click", handleAdminToggle);
  els.logoutBtn.addEventListener("click", logout);
  els.loginForm.addEventListener("submit", handleLogin);
  els.closeLoginBtn.addEventListener("click", () => els.loginDialog.close());
  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim().toLowerCase();
    renderRows();
  });
  els.adminForm.addEventListener("submit", handleSavePayment);
  els.resetFormBtn.addEventListener("click", () => fillFormFromMonth(Number(els.monthSelect.value || 1)));
  els.monthSelect.addEventListener("change", () => fillFormFromMonth(Number(els.monthSelect.value)));
  els.receiptFile.addEventListener("change", handleFilePreview);
  els.paymentRows.addEventListener("click", handleTableClick);
  els.closeReceiptBtn.addEventListener("click", () => els.receiptDialog.close());
}

function buildDefaultPayments() {
  return Array.from({ length: CONFIG.months }, (_, index) => ({
    id: null,
    month_number: index + 1,
    period_label: `Mes ${index + 1}`,
    due_amount: CONFIG.monthlyAmount,
    due_date: getScheduledDueDate(index),
    paid_amount: 0,
    paid_at: null,
    receipt_path: null,
    receipt_url: null,
    notes: null,
    updated_at: null
  }));
}

function populateMonthSelect() {
  els.monthSelect.innerHTML = state.payments
    .map((row) => `<option value="${row.month_number}">${escapeHtml(row.period_label)}</option>`)
    .join("");
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.session = raw ? JSON.parse(raw) : null;
  } catch {
    state.session = null;
  }

  if (state.session && isExpired(state.session)) {
    refreshSession().catch(() => clearSession());
  }
}

async function handleAdminToggle() {
  if (isAdmin()) {
    els.adminPanel.classList.toggle("is-hidden");
    renderAdminState();
    return;
  }

  els.emailInput.value = CONFIG.adminEmail;
  els.passwordInput.value = "";
  openDialog(els.loginDialog);
}

async function handleLogin(event) {
  event.preventDefault();
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;

  try {
    setLoginSaving(true);
    const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: CONFIG.publishableKey,
        Authorization: `Bearer ${CONFIG.publishableKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(getFriendlyAuthError(data, response.status));
    }

    const userEmail = data.user?.email || "";
    if (userEmail.toLowerCase() !== CONFIG.adminEmail.toLowerCase()) {
      throw new Error("Este usuario no esta autorizado como administrador");
    }

    saveSession(data);
    els.loginDialog.close();
    els.adminPanel.classList.remove("is-hidden");
    renderAdminState();
    showToast("Sesion de administrador activa");
  } catch (error) {
    showToast(getFriendlyNetworkError(error), true);
  } finally {
    setLoginSaving(false);
  }
}

async function refreshSession() {
  if (!state.session?.refresh_token) return;

  const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: CONFIG.publishableKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh_token: state.session.refresh_token })
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.message || "Sesion vencida");
  saveSession(data);
}

async function logout() {
  const accessToken = state.session?.access_token;
  clearSession();
  renderAdminState();
  showToast("Sesion cerrada");

  if (!accessToken) return;
  await fetch(`${CONFIG.supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: CONFIG.publishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  }).catch(() => {});
}

function saveSession(data) {
  const expiresAt = Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);
  state.session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || expiresAt,
    token_type: data.token_type || "bearer",
    user: data.user
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
}

function clearSession() {
  state.session = null;
  localStorage.removeItem(STORAGE_KEY);
  els.adminPanel.classList.add("is-hidden");
}

function isExpired(session) {
  return Number(session.expires_at || 0) <= Math.floor(Date.now() / 1000) + 60;
}

function isAdmin() {
  const email = state.session?.user?.email || "";
  return Boolean(state.session?.access_token && email.toLowerCase() === CONFIG.adminEmail.toLowerCase());
}

async function loadPayments() {
  try {
    setLoading(true);
    setConnection("Sincronizando", "");

    if (state.session && isExpired(state.session)) {
      await refreshSession();
    }

    const data = await supabaseRest(`${CONFIG.tableName}?select=*&order=month_number.asc`);
    state.payments = mergePayments(Array.isArray(data) ? data : []);
    populateMonthSelect();
    fillFormFromMonth(Number(els.monthSelect.value || 1), false);
    render();
    setConnection("Conectado", "is-ok");
  } catch (error) {
    state.payments = mergePayments([]);
    render();
    setConnection("Revisar Supabase", "is-error");
    showToast(error.message.includes("payment_installments") ? "Ejecuta primero el SQL de Supabase" : error.message, true);
  } finally {
    setLoading(false);
  }
}

function mergePayments(rows) {
  const byMonth = new Map(rows.map((row) => [Number(row.month_number), normalizePayment(row)]));
  return buildDefaultPayments().map((row) => ({ ...row, ...(byMonth.get(row.month_number) || {}) }));
}

function normalizePayment(row) {
  const monthNumber = Number(row.month_number);
  return {
    ...row,
    month_number: monthNumber,
    due_amount: Number(row.due_amount || CONFIG.monthlyAmount),
    due_date: row.due_date || getScheduledDueDate(monthNumber - 1),
    paid_amount: Number(row.paid_amount || 0)
  };
}

async function handleSavePayment(event) {
  event.preventDefault();

  if (!isAdmin()) {
    showToast("Inicia sesion como administrador", true);
    return;
  }

  const month = Number(els.monthSelect.value);
  const existing = getPayment(month);
  const paidAmount = Number(els.paidInput.value || 0);

  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    showToast("Ingresa un monto valido", true);
    return;
  }

  try {
    setSaving(true);

    let receipt = {
      path: existing.receipt_path,
      url: existing.receipt_url
    };

    if (state.selectedFile) {
      receipt = await uploadReceipt(state.selectedFile, month);
    }

    const payload = {
      month_number: month,
      period_label: existing.period_label || `Mes ${month}`,
      due_amount: CONFIG.monthlyAmount,
      due_date: emptyToNull(els.dueDateInput.value),
      paid_amount: roundMoney(paidAmount),
      paid_at: emptyToNull(els.paidDateInput.value),
      receipt_path: receipt.path || null,
      receipt_url: receipt.url || null,
      notes: emptyToNull(els.notesInput.value.trim()),
      updated_at: new Date().toISOString()
    };

    await supabaseRest(`${CONFIG.tableName}?on_conflict=month_number`, {
      method: "POST",
      auth: true,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(payload)
    });

    clearSelectedFile();
    await loadPayments();
    fillFormFromMonth(month);
    showToast("Pago guardado");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setSaving(false);
  }
}

async function uploadReceipt(file, month) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El comprobante debe ser una imagen");
  }

  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const path = `recibos/mes-${month}/${Date.now()}-${safeName}`;
  const encodedPath = encodeObjectPath(path);
  const response = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${CONFIG.bucketName}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: CONFIG.publishableKey,
      Authorization: `Bearer ${state.session.access_token}`,
      "Content-Type": file.type,
      "Cache-Control": "3600",
      "x-upsert": "true"
    },
    body: file
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "No se pudo subir el comprobante");
  }

  return {
    path,
    url: `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.bucketName}/${encodedPath}`
  };
}

async function supabaseRest(path, options = {}) {
  const headers = {
    apikey: CONFIG.publishableKey,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (options.auth) {
    if (!state.session?.access_token) throw new Error("Sesion de administrador requerida");
    headers.Authorization = `Bearer ${state.session.access_token}`;
  } else {
    headers.Authorization = `Bearer ${CONFIG.publishableKey}`;
  }

  const response = await fetch(`${CONFIG.restUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    method: options.method || "GET",
    headers,
    body: options.body
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || data.hint || `Error ${response.status}`);
  }

  return data;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function handleFilePreview(event) {
  const file = event.target.files?.[0] || null;
  clearSelectedFile(false);

  if (!file) {
    fillFormFromMonth(Number(els.monthSelect.value), false);
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("Selecciona una imagen valida", true);
    els.receiptFile.value = "";
    return;
  }

  state.selectedFile = file;
  state.previewUrl = URL.createObjectURL(file);
  setPreviewImage(state.previewUrl);
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const month = Number(button.dataset.month);
  const payment = getPayment(month);

  if (button.dataset.action === "view" && payment.receipt_url) {
    openReceipt(payment);
  }

  if (button.dataset.action === "edit" && isAdmin()) {
    els.adminPanel.classList.remove("is-hidden");
    fillFormFromMonth(month);
    els.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fillFormFromMonth(month, clearFile = true) {
  const payment = getPayment(month);
  if (!payment) return;

  els.monthSelect.value = String(month);
  els.paidInput.value = payment.paid_amount ? formatDecimalInput(payment.paid_amount) : "";
  els.paidDateInput.value = payment.paid_at || "";
  els.dueDateInput.value = payment.due_date || "";
  els.notesInput.value = payment.notes || "";

  if (clearFile) clearSelectedFile();
  if (!state.selectedFile) {
    if (payment.receipt_url) {
      setPreviewImage(payment.receipt_url);
    } else {
      setPreviewEmpty();
    }
  }
}

function clearSelectedFile(resetInput = true) {
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
  }
  state.selectedFile = null;
  state.previewUrl = null;
  if (resetInput) els.receiptFile.value = "";
}

function setPreviewImage(src) {
  els.receiptPreview.classList.remove("is-empty");
  els.receiptPreview.innerHTML = `<img src="${src}" alt="Vista previa del comprobante">`;
}

function setPreviewEmpty() {
  els.receiptPreview.classList.add("is-empty");
  els.receiptPreview.innerHTML = "<span>Vista previa</span>";
}

function openReceipt(payment) {
  els.receiptImage.src = payment.receipt_url;
  els.receiptMonth.textContent = payment.period_label;
  els.receiptTitle.textContent = getStatus(payment).label;
  els.receiptDetails.textContent = `${formatMoney(payment.paid_amount)} pagados${payment.paid_at ? ` el ${formatDate(payment.paid_at)}` : ""}`;
  openDialog(els.receiptDialog);
}

function render() {
  renderSummary();
  renderRows();
  renderAdminState();
}

function renderSummary() {
  const paid = roundMoney(state.payments.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0));
  const remaining = Math.max(roundMoney(CONFIG.totalAmount - paid), 0);
  const extra = Math.max(roundMoney(paid - CONFIG.totalAmount), 0);
  const paidMonths = state.payments.filter((row) => getStatus(row).key === "paid").length;
  const next = state.payments.find((row) => getStatus(row).key !== "paid");
  const lastPaid = [...state.payments].reverse().find((row) => row.paid_at || Number(row.paid_amount) > 0);
  const progress = Math.min((paid / CONFIG.totalAmount) * 100, 100);

  els.totalAmount.textContent = formatMoney(CONFIG.totalAmount);
  els.paidAmount.textContent = formatMoney(paid);
  els.remainingAmount.textContent = formatMoney(remaining);
  els.extraAmount.textContent = formatMoney(extra);
  els.paidMonths.textContent = `${paidMonths} de ${CONFIG.months} cuotas`;
  els.nextPayment.textContent = next ? `${next.period_label} pendiente` : "Plan completado";
  els.lastPayment.textContent = lastPaid ? `Ultimo: ${lastPaid.period_label}` : "Sin pagos registrados";
  els.progressPercent.textContent = `${Math.round(progress)}%`;
  els.progressBar.style.width = `${progress}%`;
  els.tableSummary.textContent = `${paidMonths} pagadas`;

  if (els.sideStatusLabel) {
    els.sideStatusLabel.textContent = next ? `${paidMonths} de ${CONFIG.months} cuotas pagadas` : "Plan completado";
  }

  if (els.sideProgressBar) {
    els.sideProgressBar.style.width = `${progress}%`;
  }

  renderCharts({ paid, remaining, extra, paidMonths, progress });
}

function renderCharts(summary) {
  renderLineChart();
  renderMonthlyBars();

  const degrees = Math.round((summary.progress / 100) * 360);
  if (els.donutChart) {
    els.donutChart.style.background = `
      radial-gradient(circle at center, #ffffff 0 54%, transparent 55%),
      conic-gradient(var(--emerald) 0deg, var(--emerald) ${degrees}deg, rgba(33, 83, 70, 0.12) ${degrees}deg 360deg)
    `;
  }

  if (els.donutPercent) els.donutPercent.textContent = `${Math.round(summary.progress)}%`;
  if (els.chartPaid) els.chartPaid.textContent = formatMoney(summary.paid);
  if (els.chartPending) els.chartPending.textContent = formatMoney(summary.remaining);
  if (els.chartExtra) els.chartExtra.textContent = formatMoney(summary.extra);

  const monthsWithAnyPayment = state.payments.filter((row) => Number(row.paid_amount || 0) > 0).length;
  const average = monthsWithAnyPayment ? summary.paid / monthsWithAnyPayment : 0;
  if (els.chartAverage) els.chartAverage.textContent = `Promedio ${formatMoney(average)}`;
  if (els.chartCounts) els.chartCounts.textContent = `${summary.paidMonths} / ${CONFIG.months}`;
}

function renderLineChart() {
  if (!els.paymentLineChart) return;

  const width = 720;
  const height = 260;
  const padX = 42;
  const padTop = 28;
  const padBottom = 38;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padTop - padBottom;
  const maxValue = Math.max(CONFIG.totalAmount, ...state.payments.map((row) => Number(row.paid_amount || 0))) || CONFIG.totalAmount;

  let cumulative = 0;
  const paidPoints = state.payments.map((row, index) => {
    cumulative += Number(row.paid_amount || 0);
    return chartPoint(index, cumulative, maxValue, padX, padTop, plotWidth, plotHeight);
  });

  const targetPoints = state.payments.map((row, index) => {
    const value = Math.min((index + 1) * CONFIG.monthlyAmount, CONFIG.totalAmount);
    return chartPoint(index, value, maxValue, padX, padTop, plotWidth, plotHeight);
  });

  const baseY = padTop + plotHeight;
  const linePath = pointsToPath(paidPoints);
  const targetPath = pointsToPath(targetPoints);
  const areaPath = `${linePath} L ${paidPoints[paidPoints.length - 1].x} ${baseY} L ${paidPoints[0].x} ${baseY} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padTop + plotHeight * ratio;
      return `<line class="chart-grid-line" x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}"></line>`;
    })
    .join("");
  const dots = paidPoints
    .filter((point, index) => index === 0 || index === paidPoints.length - 1 || Number(state.payments[index].paid_amount || 0) > 0)
    .map((point) => `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="6"></circle>`)
    .join("");

  els.paymentLineChart.innerHTML = `
    <defs>
      <linearGradient id="paidAreaGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(12, 168, 120, 0.28)"></stop>
        <stop offset="100%" stop-color="rgba(12, 168, 120, 0.02)"></stop>
      </linearGradient>
    </defs>
    ${grid}
    <path class="chart-area" d="${areaPath}"></path>
    <path class="chart-target" d="${targetPath}"></path>
    <path class="chart-line" d="${linePath}"></path>
    ${dots}
    <text class="chart-label" x="${padX}" y="${height - 8}">Mes 1</text>
    <text class="chart-label" x="${width / 2 - 24}" y="${height - 8}">Mes 6</text>
    <text class="chart-label" x="${width - padX - 58}" y="${height - 8}">Mes 12</text>
  `;
}

function chartPoint(index, value, maxValue, padX, padTop, plotWidth, plotHeight) {
  const x = padX + (plotWidth / Math.max(CONFIG.months - 1, 1)) * index;
  const y = padTop + plotHeight - (Math.min(value, maxValue) / maxValue) * plotHeight;
  return { x: roundNumber(x), y: roundNumber(y) };
}

function pointsToPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function renderMonthlyBars() {
  if (!els.monthlyBars) return;

  els.monthlyBars.innerHTML = state.payments
    .map((row) => {
      const paid = Number(row.paid_amount || 0);
      const due = Number(row.due_amount || CONFIG.monthlyAmount);
      const percent = Math.min((paid / due) * 100, 100);
      const status = getStatus(row);
      const fillClass = status.key === "pending" ? "is-pending" : status.key === "partial" ? "is-partial" : "";
      return `
        <div class="month-bar" title="${escapeHtml(row.period_label)} ${formatMoney(paid)}">
          <span>${escapeHtml(row.period_label.replace("Mes ", "M"))}</span>
          <div class="bar-track"><span class="bar-fill ${fillClass}" style="width: ${percent}%"></span></div>
          <span>${Math.round(percent)}%</span>
        </div>
      `;
    })
    .join("");
}

function renderRows() {
  const admin = isAdmin();
  document.querySelectorAll(".admin-column").forEach((node) => {
    node.classList.toggle("is-hidden", !admin);
  });

  const rows = getFilteredPayments();
  const emptyColspan = admin ? 7 : 6;

  if (!rows.length) {
    els.paymentRows.innerHTML = `<tr><td colspan="${emptyColspan}">No hay cuotas que coincidan con la busqueda.</td></tr>`;
    return;
  }

  els.paymentRows.innerHTML = rows
    .map((row) => {
      const status = getStatus(row);
      const dueDate = row.due_date ? `Vence ${formatDate(row.due_date)}` : "Sin fecha programada";
      const receiptButton = row.receipt_url
        ? `<button class="link-button" data-action="view" data-month="${row.month_number}" type="button">Ver comprobante</button>`
        : `<button class="link-button" type="button" disabled>Sin comprobante</button>`;
      const editButton = admin
        ? `<td class="admin-column"><button class="link-button" data-action="edit" data-month="${row.month_number}" type="button">Editar pago</button></td>`
        : "";

      return `
        <tr>
          <td>
            <div class="month-cell">
              <strong>${escapeHtml(row.period_label)}</strong>
              <span>${dueDate}</span>
            </div>
          </td>
          <td>${formatMoney(row.due_amount)}</td>
          <td>${formatMoney(row.paid_amount)}</td>
          <td><span class="status-badge ${status.className}">${status.label}</span></td>
          <td>${row.paid_at ? formatDate(row.paid_at) : "Pendiente"}</td>
          <td>${receiptButton}</td>
          ${editButton}
        </tr>
      `;
    })
    .join("");
}

function getFilteredPayments() {
  if (!state.search) return state.payments;

  return state.payments.filter((row) => {
    const status = getStatus(row).label;
    const text = [
      row.period_label,
      row.due_date ? formatDate(row.due_date) : "sin fecha programada",
      row.paid_at ? formatDate(row.paid_at) : "pendiente",
      status,
      row.notes || "",
      formatMoney(row.paid_amount)
    ]
      .join(" ")
      .toLowerCase();
    return text.includes(state.search);
  });
}

function renderAdminState() {
  const admin = isAdmin();
  els.logoutBtn.classList.toggle("is-hidden", !admin);
  if (els.adminToggleLabel) {
    els.adminToggleLabel.textContent = admin ? "Panel admin" : "Panel admin";
  } else {
    els.adminToggleBtn.textContent = "Panel admin";
  }
  els.adminIdentity.textContent = admin ? state.session.user.email : "Sin sesion";
  if (!admin) {
    els.adminPanel.classList.add("is-hidden");
  }
  if (els.contentGrid) {
    els.contentGrid.classList.toggle("admin-open", admin && !els.adminPanel.classList.contains("is-hidden"));
  }
}

function getStatus(row) {
  const paid = Number(row.paid_amount || 0);
  const due = Number(row.due_amount || CONFIG.monthlyAmount);

  if (paid >= due) {
    return { key: "paid", label: paid > due ? "Pagado +" : "Pagado", className: "status-paid" };
  }

  if (paid > 0) {
    return { key: "partial", label: "Parcial", className: "status-partial" };
  }

  return { key: "pending", label: "Pendiente", className: "status-pending" };
}

function getPayment(month) {
  return state.payments.find((row) => Number(row.month_number) === Number(month));
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  els.refreshBtn.disabled = isLoading;
}

function setSaving(isSaving) {
  els.savePaymentBtn.disabled = isSaving;
  els.savePaymentBtn.textContent = isSaving ? "Guardando" : "Guardar pago";
}

function setLoginSaving(isSaving) {
  els.loginSubmitBtn.disabled = isSaving;
  els.loginSubmitBtn.textContent = isSaving ? "Ingresando" : "Ingresar";
}

function setConnection(text, className) {
  els.connectionStatus.className = `connection-status ${className || ""}`.trim();
  els.connectionStatus.textContent = text;
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.background = isError ? "#c2413a" : "#172026";
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 3600);
}

function getFriendlyAuthError(data, status) {
  const message = String(data?.message || data?.error_description || "").toLowerCase();

  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Correo o contrasena incorrectos. Revisa el usuario en Supabase Auth.";
  }

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "El correo no esta confirmado. En Supabase Auth activa Auto Confirm o confirma el usuario.";
  }

  if (message.includes("api key") || status === 401 || status === 403) {
    return "Supabase rechazo la clave publica o el acceso. Revisa Project Settings > API.";
  }

  return data?.message || "No se pudo iniciar sesion";
}

function getFriendlyNetworkError(error) {
  const message = String(error?.message || "");

  if (message.toLowerCase().includes("failed to fetch")) {
    return "No se pudo conectar con Supabase. Prueba abrir la plataforma con un servidor local.";
  }

  return message || "No se pudo iniciar sesion";
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDecimalInput(value) {
  return Number(value || 0).toFixed(2);
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function roundNumber(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getScheduledDueDate(monthOffset) {
  const [year, month, day] = CONFIG.firstDueDate.split("-").map(Number);
  const date = new Date(year, month - 1 + monthOffset, day);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function emptyToNull(value) {
  return value === "" ? null : value;
}

function encodeObjectPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
