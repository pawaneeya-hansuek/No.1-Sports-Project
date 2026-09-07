export const PREVIEW = import.meta.env?.VITE_PREVIEW_MODE === "true";
let csrf = "";
export function setCsrf(value) {
  csrf = value;
}
export async function api(action, data, params = {}) {
  const url = new URL("api/index.php", window.location.href.split("#")[0]);
  url.search = new URLSearchParams({ action, ...params });
  const multipart = data instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let value;
  let r;
  try {
  r = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers:
      data === undefined
        ? {}
        : {
            "X-CSRF-Token": csrf,
            ...(multipart ? {} : { "Content-Type": "application/json" }),
          },
    body:
      data === undefined ? undefined : multipart ? data : JSON.stringify(data),
    signal: controller.signal,
  });
  try {
    value = await r.json();
  } catch {
    throw new Error("ยังเชื่อมต่อระบบจองไม่ได้ กรุณาติดต่อผู้ดูแล");
  }
  } catch (e) {
    if (controller.signal.aborted)
      throw new Error("ระบบตอบกลับช้า กรุณาตรวจสอบรายการจองก่อนลองอีกครั้ง");
    if (e instanceof TypeError)
      throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
  if (!r.ok) throw new Error(value?.error || "ไม่สามารถดำเนินการได้");
  if (value === null || typeof value !== "object")
    throw new Error("ข้อมูลจากระบบไม่ถูกต้อง กรุณาลองใหม่");
  return value;
}
export function bangkokDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function displayDate(date, short = false) {
  return new Date(date + "T12:00:00+07:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
  });
}
export const previewFields = [
  {
    id: 1,
    name: "สนาม A",
    description: "สนามฟุตบอล 5 คน • หญ้าเทียม",
    price: 800,
    image_url: "./field.jpg",
    active: 1,
  },
  {
    id: 2,
    name: "สนาม B",
    description: "สนามฟุตบอล 7 คน • หญ้าเทียม",
    price: 1200,
    image_url: "./field.jpg",
    active: 1,
  },
  {
    id: 3,
    name: "สนาม C",
    description: "สนามฟุตบอล 5 คน • หญ้าเทียม",
    price: 800,
    image_url: "./field.jpg",
    active: 1,
  },
];
export const previewSettings = {
  address: "",
  contact: "",
  facilities:
    "ลูกฟุตบอลสำหรับยืม\nเสื้อแบ่งทีม\nพื้นที่พักข้างสนาม\nไฟส่องสว่าง",
  promotion:
    "จัดทีมให้พร้อม แล้วมาเล่นด้วยกัน\nติดตามโปรโมชั่นใหม่ได้ที่หน้านี้",
  promotion_code: "No.1Sports",
  promotion_percent: 20,
  rules:
    "มาถึงก่อนเวลา 15 นาที\nสวมรองเท้าที่เหมาะกับพื้นสนาม\nแสดงตั๋ว QR ให้ผู้ดูแลก่อนเข้าสนาม",
  bank_name: "กสิกรไทย",
  bank_account: "164-8-13740-7",
  bank_holder: "ภาวนียา หาญศึก",
  booking_enabled: 0,
  payment_qr: null,
};
export const labels = {
  pending_payment: "รอชำระเงิน",
  review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  checked_in: "กำลังใช้สนาม",
  completed: "หมดเวลาแล้ว",
  cancelled: "ยกเลิกแล้ว",
  expired: "หมดเวลาชำระ",
  rejected: "สลิปไม่ผ่าน",
};
export function previewBookings() {
  return [
    {
      id: 1,
      code: "DEMO-NO1-001",
      field_id: 1,
      field_name: "สนาม A",
      booking_date: bangkokDate(),
      start_hour: 18,
      end_hour: 19,
      amount: 800,
      status: "confirmed",
      name: "ลูกค้าตัวอย่าง",
      phone: "08X-XXX-XXXX",
      email: "",
      ticket_token: null,
      review_note: "",
      created_at: bangkokDate() + " 10:00:00",
    },
    {
      id: 2,
      code: "DEMO-NO1-002",
      field_id: 2,
      field_name: "สนาม B",
      booking_date: bangkokDate(),
      start_hour: 19,
      end_hour: 21,
      amount: 2400,
      status: "review",
      name: "ทีมตัวอย่าง",
      phone: "09X-XXX-XXXX",
      email: "",
      ticket_token: null,
      review_note: "",
      created_at: bangkokDate() + " 11:00:00",
    },
  ];
}
