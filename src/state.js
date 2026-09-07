import { ref, computed, watch, nextTick } from "vue";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  api,
  PREVIEW,
  setCsrf,
  bangkokDate,
  displayDate,
  previewFields,
  previewSettings,
  previewBookings,
  labels,
} from "./api";
export { PREVIEW, displayDate, labels };
export const route = ref(location.hash.slice(1) || "home"),
  user = ref(null),
  fields = ref(PREVIEW ? previewFields : []),
  settings = ref({
    ...(PREVIEW ? previewSettings : { bank_name: '', bank_account: '', bank_holder: '', booking_enabled: 0, payment_qr: null }),
    facilities: PREVIEW ? previewSettings.facilities : "",
    promotion: PREVIEW ? previewSettings.promotion : "",
    promotion_code: PREVIEW ? previewSettings.promotion_code : "",
    promotion_percent: PREVIEW ? previewSettings.promotion_percent : 0,
  });
export const today = bangkokDate(),
  selectedDate = ref(today),
  selectedField = ref(1),
  duration = ref(1),
  promoCode = ref(""),
  selectedHour = ref(null),
  slots = ref([]),
  available = ref(false),
  busy = ref(false),
  loading = ref(!PREVIEW),
  initialized = ref(PREVIEW),
  offline = ref(""),
  lastSync = ref("");
export const modal = ref(""),
  notice = ref(""),
  error = ref(""),
  authMode = ref("login"),
  auth = ref({ name: "", email: "", phone: "", identity: "", password: "" }),
  myBookings = ref([]),
  activeBooking = ref(null),
  qr = ref(""),
  slip = ref(null),
  slotPage = ref(0);
export const adminRows = ref([]),
  adminLoading = ref(false),
  adminError = ref(""),
  adminSynced = ref(""),
  adminTotal = ref(0),
  adminPage = ref(1),
  adminFilter = ref(""),
  adminSearch = ref(""),
  adminAppliedSearch = ref(""),
  adminSectionLoading = ref(false),
  adminSectionError = ref(""),
  adminTab = ref("bookings"),
  stats = ref({ total: 0, review: 0, playing: 0, revenue: 0 }),
  dashboard = ref({
    summary: {
      total: 0,
      pending: 0,
      review: 0,
      confirmed: 0,
      playing: 0,
      completed: 0,
      paid_count: 0,
      revenue: 0,
    },
    popular_fields: [],
  }),
  allFields = ref([]),
  logs = ref([]),
  fieldDraft = ref({}),
  settingsDraft = ref({}),
  reviewNote = ref("");
const editableSettings = ['address', 'contact', 'facilities', 'promotion', 'promotion_code', 'promotion_percent', 'rules', 'booking_enabled'];
const settingsBaseline = ref("");
const settingsSnapshot = () => JSON.stringify(editableSettings.map(k => settingsDraft.value[k]));
export const settingsDirty = computed(() => settingsBaseline.value !== "" && settingsSnapshot() !== settingsBaseline.value);
export function resetSettingsDraft() {
  settingsDraft.value = { ...settings.value, booking_enabled: !!Number(settings.value.booking_enabled) };
  settingsBaseline.value = settingsSnapshot();
}
export async function searchAdmin(filter = adminFilter.value) {
  adminAppliedSearch.value = adminSearch.value.trim();
  adminFilter.value = filter;
  adminPage.value = 1;
  await refreshAdmin();
}
export const video = ref(null),
  scanInput = ref(""),
  scanError = ref("");
let stream,
  scanTimer,
  scannerRequest = 0,
  toastTimer,
  availabilityRequest = 0,
  mineRequest = 0,
  adminRequest = 0,
  lastAvailabilityDate = "";
export const money = (n) =>
    Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 }),
  hour = (n) => String(n).padStart(2, "0") + ":00";
export const dates = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    let d = new Date(today + "T12:00:00+07:00");
    d.setDate(d.getDate() + slotPage.value * 7 + i);
    return bangkokDate(d);
  }),
);
export const chosenField = computed(
    () =>
      fields.value.find((f) => Number(f.id) === Number(selectedField.value)) ||
      fields.value[0],
  ),
  hours = Array.from({ length: 14 }, (_, i) => i + 9),
  baseTotal = computed(
    () => Number(chosenField.value?.price || 0) * duration.value,
  ),
  promoApplied = computed(() => {
    const configured = String(settings.value.promotion_code || "").trim().toLowerCase();
    return Boolean(configured) && promoCode.value.trim().toLowerCase() === configured && Number(settings.value.promotion_percent) > 0;
  }),
  promoSavings = computed(() => (promoApplied.value ? baseTotal.value * Math.min(100, Math.max(0, Number(settings.value.promotion_percent) || 0)) / 100 : 0)),
  total = computed(
    () => baseTotal.value - promoSavings.value,
  ),
  isAdmin = computed(() => user.value?.role === "admin"),
  canAdmin = computed(() => isAdmin.value || PREVIEW),
  calendarMax = bangkokDate(new Date(Date.now() + 90 * 86400000));
export function navigate(path) {
  location.hash = path;
  route.value = path;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
export function routeForAccount() {
  if (PREVIEW || !user.value) return false;
  const destination = isAdmin.value ? "admin" : route.value === "admin" ? "home" : route.value;
  if (destination === route.value) return false;
  navigate(destination);
  return true;
}
export function scrollBooking() {
  navigate("home");
  nextTick(() =>
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }),
  );
}
export async function shareBooking() {
  const shareData = {
    title: "No.1 Sports",
    text: "มาจองสนามด้วยกันที่ No.1 Sports",
    url: window.location.href.split("#")[0] + "#home",
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast("คัดลอกลิงก์แล้ว ส่งให้เพื่อนในแชตได้เลย");
  } catch (e) {
    if (e.name !== "AbortError") toast("คัดลอกลิงก์ไม่สำเร็จ");
  }
}
export function toast(s) {
  notice.value = s;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (notice.value = ""), 5000);
}
export function show(type) {
  error.value = "";
  modal.value = type;
}
export function close() {
  modal.value = "";
  stopScanner();
}
export async function run(fn) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await fn();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
export async function boot() {
  if (PREVIEW) {
    myBookings.value = previewBookings();
    allFields.value = previewFields.map((f) => ({ ...f }));
    await refreshAvailability();
    await refreshAdmin();
    return;
  }
  try {
    const d = await api("bootstrap");
    user.value = d.user;
    setCsrf(d.csrf);
    fields.value = d.fields;
    settings.value = d.settings;
    settings.value.booking_enabled = Number(d.settings.booking_enabled);
    initialized.value = true;
    routeForAccount();
    if (!fields.value.some((f) => Number(f.id) === Number(selectedField.value)))
      selectedField.value = fields.value[0]?.id;
    offline.value = "";
    await refreshAvailability();
    if (user.value) await refreshMine();
  } catch (e) {
    offline.value = e.message;
  } finally {
    loading.value = false;
  }
}
export function slotState(h) {
  if (h + Number(duration.value) > 23) return "closed";
  if (
    !PREVIEW &&
    new Date(`${selectedDate.value}T${hour(h)}:00+07:00`).getTime() <=
      Date.now()
  )
    return "past";
  if (
    slots.value.some(
      (s) =>
        Number(s.field_id) === Number(chosenField.value?.id) &&
        Number(s.start_hour) < h + Number(duration.value) &&
        Number(s.end_hour) > h,
    )
  )
    return "full";
  return available.value ? "free" : "unknown";
}
export async function refreshAvailability() {
  const request = ++availabilityRequest;
  if (lastAvailabilityDate !== selectedDate.value) available.value = false;
  if (PREVIEW) {
    slots.value =
      selectedDate.value === today
        ? [
            { field_id: 1, start_hour: 18, end_hour: 20 },
            { field_id: 2, start_hour: 19, end_hour: 21 },
            { field_id: 3, start_hour: 17, end_hour: 19 },
          ]
        : [];
    available.value = true;
    return;
  }
  try {
    const d = await api("availability", undefined, {
      date: selectedDate.value,
    });
    if (request !== availabilityRequest) return;
    slots.value = d.slots;
    available.value = true;
    lastAvailabilityDate = selectedDate.value;
    offline.value = "";
    lastSync.value = new Date().toLocaleTimeString("th-TH");
    if (selectedHour.value !== null && slotState(selectedHour.value) !== "free")
      selectedHour.value = null;
  } catch (e) {
    if (request === availabilityRequest) {
      offline.value = e.message;
      available.value = false;
    }
  }
}
export async function refreshMine() {
  if (PREVIEW) return;
  const request = ++mineRequest;
  const owner = user.value;
  const rows = await api("my_bookings");
  if (request !== mineRequest || owner !== user.value) return;
  myBookings.value = rows;
  if (activeBooking.value && route.value !== "admin") {
    const current = myBookings.value.find(
      (b) => b.code === activeBooking.value.code,
    );
    if (current) activeBooking.value = current;
  }
}
export async function refreshAdmin() {
  if (!canAdmin.value) return;
  if (PREVIEW) {
    adminRows.value = previewBookings().filter(
      (b) =>
        (!adminFilter.value || b.status === adminFilter.value) &&
        (!adminAppliedSearch.value || [b.code, b.name, b.phone].some(v => String(v || '').toLowerCase().includes(adminAppliedSearch.value.toLowerCase()))),
    );
    adminTotal.value = adminRows.value.length;
    stats.value = { total: 2, review: 1, playing: 0, revenue: 800 };
    return;
  }
  const request = ++adminRequest;
  const owner = user.value;
  adminLoading.value = true;
  try {
  const d = await api("admin_bookings", undefined, {
    page: adminPage.value,
    filter: adminFilter.value,
    search: adminAppliedSearch.value,
  });
  if (request !== adminRequest || owner !== user.value) return;
  adminRows.value = d.rows;
  if (activeBooking.value && modal.value === 'review') {
    const current = d.rows.find(b => b.code === activeBooking.value.code);
    if (current) activeBooking.value = current;
    else {
      const booking = await api('ticket_lookup', undefined, { code: activeBooking.value.code });
      if (request !== adminRequest || owner !== user.value) return;
      if (activeBooking.value?.code === booking.code) activeBooking.value = booking;
    }
  }
  adminTotal.value = d.total;
  stats.value = d.stats;
  dashboard.value = d.dashboard;
  adminError.value = "";
  adminSynced.value = new Date().toLocaleTimeString("th-TH");
  const lastPage = Math.max(1, Math.ceil(d.total / 50));
  if (adminPage.value > lastPage) {
    adminPage.value = lastPage;
    await refreshAdmin();
  }
  } catch (e) {
    if (request === adminRequest && owner === user.value) adminError.value = e.message;
  } finally {
    if (request === adminRequest) adminLoading.value = false;
  }
}
export async function authenticate() {
  await run(async () => {
    if (PREVIEW)
      throw new Error(
        "ตัวอย่างนี้ยังไม่รับข้อมูลสมาชิก กรุณาติดตั้งระบบ PHP/MySQL ก่อน",
      );
    const d = await api(
      authMode.value === "register" ? "register" : "login",
      auth.value,
    );
    user.value = d.user;
    setCsrf(d.csrf);
    auth.value = { name: "", email: "", phone: "", identity: "", password: "" };
    const destination = isAdmin.value ? "admin" : "home";
    const changedRoute = route.value !== destination;
    navigate(destination);
    close();
    toast("เข้าสู่ระบบแล้ว");
    try {
      await refreshMine();
    } catch (e) {
      offline.value = e.message;
    }
    if (!changedRoute && isAdmin.value) await loadAdmin();
  });
}
export async function logout() {
  await run(async () => {
    const d = await api("logout", {});
    setCsrf(d.csrf);
    user.value = null;
    myBookings.value = [];
    adminRows.value = [];
    ++adminRequest;
    ++adminSectionRequest;
    adminLoading.value = false;
    adminSectionLoading.value = false;
    allFields.value = [];
    logs.value = [];
    adminTotal.value = 0;
    adminSearch.value = adminAppliedSearch.value = adminFilter.value = '';
    adminPage.value = 1;
    adminError.value = adminSectionError.value = adminSynced.value = '';
    settingsDraft.value = {};
    settingsBaseline.value = '';
    activeBooking.value = null;
    close();
    navigate("home");
  });
}
export function startBooking() {
  if (!user.value) {
    authMode.value = "login";
    show("auth");
    return;
  }
  show("confirm");
}
export async function book() {
  await run(async () => {
    if (
      PREVIEW ||
      offline.value ||
      !available.value ||
      !settings.value.booking_enabled ||
      selectedHour.value === null
    )
      throw new Error("กรุณาเลือกเวลาว่างอีกครั้ง");
    activeBooking.value = await api("book", {
      field_id: Number(chosenField.value.id),
      date: selectedDate.value,
      start: selectedHour.value,
      end: selectedHour.value + Number(duration.value),
      promo_code: promoCode.value.trim(),
    });
    slip.value = null;
    show("payment");
    await Promise.allSettled([refreshMine(), refreshAvailability()]);
  });
}
export function openBooking(b) {
  activeBooking.value = b;
  slip.value = null;
  show(b.status === "pending_payment" ? "payment" : "ticket");
}
export async function sendSlip() {
  await run(async () => {
    if (!slip.value) throw new Error("เลือกรูปสลิปก่อน");
    if (activeBooking.value?.status !== 'pending_payment') throw new Error('รายการนี้ไม่อยู่ในสถานะรอชำระเงิน');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(slip.value.type) || slip.value.size < 1 || slip.value.size > 5 * 1024 * 1024)
      throw new Error('เลือกรูป JPG, PNG หรือ WebP ไม่เกิน 5 MB');
    const f = new FormData();
    f.append("code", activeBooking.value.code);
    f.append("image", slip.value);
    const response = await api("slip", f);
    activeBooking.value = response.booking;
    slip.value = null;
    show("ticket");
    toast("ส่งสลิปแล้ว กำลังรอผู้ดูแลตรวจสอบ");
    await Promise.allSettled([refreshMine(), refreshAvailability()]);
  });
}
export async function cancelBooking() {
  await run(async () => {
    const response = await api("cancel", { code: activeBooking.value.code });
    activeBooking.value = response.booking;
    close();
    toast("ยกเลิกการจองแล้ว");
    await Promise.allSettled([refreshMine(), refreshAvailability()]);
  });
}
export function openReview(b) {
  activeBooking.value = b;
  reviewNote.value = "";
  show("review");
}
export async function action(type) {
  await run(async () => {
    if (PREVIEW) throw new Error("ข้อมูลตัวอย่าง ไม่สามารถเปลี่ยนสถานะจริงได้");
    if (type === 'reject' && !reviewNote.value.trim()) throw new Error('กรุณาระบุเหตุผลที่ไม่ผ่าน');
    const response = await api("admin_action", {
      code: activeBooking.value.code,
      type,
      note: reviewNote.value,
    });
    activeBooking.value = response.booking;
    close();
    toast("บันทึกสถานะแล้ว");
    await Promise.allSettled([refreshAdmin(), refreshAvailability()]);
  });
}
export async function deleteAuditLog(log) {
  await run(async () => {
    if (PREVIEW) throw new Error("ข้อมูลตัวอย่าง ไม่สามารถลบประวัติจริงได้");
    if (!log?.id || !window.confirm("ลบประวัติรายการนี้หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้")) return;
    await api("delete_audit", { id: Number(log.id) });
    logs.value = logs.value.filter((item) => item.id !== log.id);
    toast("ลบประวัติแล้ว");
  });
}
export async function deleteBookingHistory(booking) {
  await run(async () => {
    if (PREVIEW) throw new Error("ข้อมูลตัวอย่าง ไม่สามารถลบรายการจริงได้");
    if (!booking?.code || !window.confirm("ลบประวัติการจองนี้และข้อมูลที่เกี่ยวข้องหรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้")) return;
    await api("delete_booking", { code: booking.code });
    await refreshAdmin();
    toast("ลบประวัติการจองแล้ว");
  });
}
export async function lookup() {
  await run(async () => {
    if (PREVIEW)
      throw new Error("การค้นหาตั๋วจริงจะใช้ได้เมื่อติดตั้งระบบหลังบ้าน");
    activeBooking.value = await api("ticket_lookup", undefined, {
      code: scanInput.value.trim(),
    });
    reviewNote.value = "";
    stopScanner();
    show("review");
  });
}
export async function startScanner() {
  stopScanner();
  const request = scannerRequest;
  scanError.value = "";
  if (PREVIEW) {
    scanError.value = "ตัวอย่างไม่เปิดกล้องหรือเช็คอินจริง";
    return;
  }
  try {
    const camera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    if (request !== scannerRequest) {
      camera.getTracks().forEach(t => t.stop());
      return;
    }
    stream = camera;
    await nextTick();
    if (request !== scannerRequest) return;
    video.value.srcObject = stream;
    await video.value.play();
    if (request !== scannerRequest) return;
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    scanTimer = setInterval(async () => {
      if (!video.value || video.value.readyState < 2) return;
      canvas.width = video.value.videoWidth;
      canvas.height = video.value.videoHeight;
      ctx.drawImage(video.value, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height),
        found = jsQR(data.data, data.width, data.height);
      if (found) {
        scanInput.value = found.data;
        stopScanner();
        await lookup();
      }
    }, 350);
  } catch {
    if (request !== scannerRequest) return;
    scanError.value =
      "เปิดกล้องไม่ได้ กรุณาอนุญาตกล้อง ใช้ HTTPS หรือกรอกรหัสตั๋ว";
    stopScanner();
  }
}
export function scanImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  stopScanner();
  scanError.value = "";
  const url = URL.createObjectURL(file),
    image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height),
      found = jsQR(data.data, data.width, data.height);
    URL.revokeObjectURL(url);
    if (!found) {
      scanError.value = "ไม่พบ QR ในภาพ กรุณาถ่ายให้เห็น QR ชัดเจน";
      return;
    }
    scanInput.value = found.data;
    lookup();
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    scanError.value = "อ่านภาพไม่ได้ กรุณาลองใหม่";
  };
  image.src = url;
}
export function stopScanner() {
  ++scannerRequest;
  clearInterval(scanTimer);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  if (video.value) video.value.srcObject = null;
}
export function editField(f) {
  fieldDraft.value = f
    ? { ...f, active: !!Number(f.active) }
    : { name: "", description: "", price: 0, image_url: "", active: true };
  show("field");
}
export async function saveField() {
  await run(async () => {
    if (PREVIEW) throw new Error("ตัวอย่างยังไม่บันทึกข้อมูลจริง");
    await api("field_save", fieldDraft.value);
    allFields.value = await api("admin_fields");
    fields.value = allFields.value.filter((f) => Number(f.active));
    close();
    toast("บันทึกสนามแล้ว");
  });
}
export async function uploadField(e) {
  await run(async () => {
    if (PREVIEW) throw new Error("ตัวอย่างยังไม่รับรูปจริง");
    if (!e.target.files[0]) return;
    const f = new FormData();
    f.append("id", fieldDraft.value.id);
    f.append("image", e.target.files[0]);
    await api("field_image", f);
    allFields.value = await api("admin_fields");
    const updated = allFields.value.find(
        (f) => Number(f.id) === Number(fieldDraft.value.id),
      );
    if (updated) fieldDraft.value.image_url = updated.image_url;
    fields.value = allFields.value.filter((f) => Number(f.active));
    toast("อัปโหลดรูปแล้ว");
  });
}
export async function saveSettings() {
  await run(async () => {
    if (PREVIEW) throw new Error("ตัวอย่างยังไม่บันทึกข้อมูลจริง");
    const saved = { ...settingsDraft.value };
    await api("settings_save", saved);
    Object.assign(settings.value, saved);
    settingsBaseline.value = JSON.stringify(editableSettings.map(k => saved[k]));
    toast("บันทึกการตั้งค่าแล้ว");
  });
}
export async function uploadQR(e) {
  await run(async () => {
    if (PREVIEW) throw new Error("ตัวอย่างยังไม่รับ QR จริง");
    if (!e.target.files[0]) return;
    const f = new FormData();
    f.append("image", e.target.files[0]);
    await api("payment_qr", f);
    await boot();
    toast("บันทึก QR รับเงินแล้ว");
  });
}
export async function copyAccount() {
  try {
    await navigator.clipboard.writeText(settings.value.bank_account);
    toast("คัดลอกเลขบัญชีแล้ว");
  } catch {
    toast("เลขบัญชี " + settings.value.bank_account);
  }
}
export async function loadAdmin() {
  if (!canAdmin.value) return;
  if (!settingsDirty.value) resetSettingsDraft();
  await Promise.all([refreshAdmin(), refreshAdminSection()]);
}
let adminSectionRequest = 0;
export async function refreshAdminSection() {
  if (!canAdmin.value || PREVIEW) return;
  const request = ++adminSectionRequest;
  const owner = user.value;
  const tab = adminTab.value;
  adminSectionError.value = '';
  adminSectionLoading.value = true;
  try {
    if (tab === 'fields' || tab === 'audit') {
      const result = await api(tab === 'fields' ? 'admin_fields' : 'audit');
      if (request !== adminSectionRequest || owner !== user.value) return;
      if (tab === 'fields') allFields.value = result;
      else logs.value = result;
    }
  } catch (e) {
    if (request === adminSectionRequest && owner === user.value) adminSectionError.value = e.message;
  } finally {
    if (request === adminSectionRequest) adminSectionLoading.value = false;
  }
}
watch([selectedDate, duration, selectedField], () => {
  selectedHour.value = null;
  refreshAvailability();
});
watch(
  activeBooking,
  async (b, previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => { cancelled = true; });
    qr.value = "";
    if (
      b?.ticket_token &&
      ["confirmed", "checked_in", "completed"].includes(b.status)
    ) {
      const image = await QRCode.toDataURL(b.ticket_token, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      if (!cancelled) qr.value = image;
    }
  },
  { deep: true },
);
watch(route, async (r) => {
  try {
    if (routeForAccount()) return;
    if (r === "bookings" && user.value) await refreshMine();
    if (r === "admin") await loadAdmin();
  } catch (e) {
    toast(e.message);
  }
});
watch(adminTab, () => { refreshAdminSection(); });
