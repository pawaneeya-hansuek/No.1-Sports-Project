<script setup>
import { onMounted, onUnmounted, nextTick } from "vue";
import {
  ArrowUpRight,
  Clock3,
  CalendarDays,
  Ticket,
  Settings2,
  Users,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Plus,
} from "lucide-vue-next";
import Home from "./Home.vue";
import Admin from "./Admin.vue";
import Modals from "./Modals.vue";
import { startPolling } from "./polling";
import {
  PREVIEW,
  route,
  user,
  settings,
  isAdmin,
  canAdmin,
  offline,
  notice,
  myBookings,
  authMode,
  today,
  calendarMax,
  selectedDate,
  fields,
  available,
  initialized,
  boot,
  loadAdmin,
  refreshAvailability,
  refreshMine,
  refreshAdmin,
  stopScanner,
  scrollBooking,
  show,
  logout,
  routeForAccount,
  openBooking,
  money,
  hour,
  displayDate,
  labels,
  navigate,
} from "./state";
let timer;
const lifecycle = new AbortController();
function hashChange() {
  route.value = location.hash.slice(1) || "home";
  routeForAccount();
}
onMounted(async () => {
  window.addEventListener("hashchange", hashChange);
  await boot();
  if (lifecycle.signal.aborted) return;
  try {
    if (route.value === "admin") await loadAdmin();
  } catch (e) {
    offline.value = e.message;
  }
  if (lifecycle.signal.aborted) return;
  timer = startPolling(async () => {
    if (document.hidden || PREVIEW) return;
    try {
      if (!initialized.value) {
        await boot();
        if (initialized.value && route.value === "admin") await loadAdmin();
        return;
      }
      await refreshAvailability();
      if (user.value) await refreshMine();
      if (route.value === "admin" && isAdmin.value) await refreshAdmin();
    } catch (e) {
      offline.value = e.message;
    }
  }, 5000);
  if (document.modelContext?.registerTool) {
    try {
      await document.modelContext.registerTool(
        {
          name: "select_booking_date",
          title: "เลือกวันที่ดูสนามว่าง",
          description:
            "Select a date and display available football field slots. Does not reserve or pay.",
          inputSchema: {
            type: "object",
            properties: {
              date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            },
            required: ["date"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input) => {
            if (
              !input ||
              typeof input.date !== "string" ||
              !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
              input.date < today ||
              input.date > calendarMax ||
              new Date(input.date).toISOString().slice(0, 10) !== input.date
            )
              throw new Error("Invalid booking date");
            selectedDate.value = input.date;
            navigate("home");
            await nextTick();
            await refreshAvailability();
            return {
              date: selectedDate.value,
              preview: PREVIEW,
              available: available.value,
              fields: fields.value.map((f) => ({ id: f.id, name: f.name })),
            };
          },
        },
        { signal: lifecycle.signal },
      );
    } catch {}
  }
});
onUnmounted(() => {
  window.removeEventListener("hashchange", hashChange);
  timer?.();
  stopScanner();
  lifecycle.abort();
});
</script>
<template>
  <div v-if="PREVIEW" class="preview-banner">
    โหมดตัวอย่าง • สนาม ราคา และข้อมูลการจองเป็นตัวอย่าง
    ยังไม่รับจองหรือชำระเงินจริง <a href="#admin">ดูหน้าแอดมิน ↗</a>
  </div>
  <header class="site-header"><div class="nav">
    <a class="brand" href="#home"
      ><span class="brand-symbol">1<span>★</span></span
      ><span>NO.1 <b>SPORTS</b><small>THE HOME OF YOUR GAME</small></span></a
    >
    <nav>
      <a :class="{ active: route === 'home' }" href="#home">หน้าแรก</a
      ><a href="#home" @click.prevent="scrollBooking">จองสนาม</a
      ><a :class="{ active: route === 'bookings' }" href="#bookings"
        >ตั๋วของฉัน</a
      ><a v-if="isAdmin" href="#admin">จัดการสนาม</a>
    </nav>
    <div class="nav-user">
      <button
        v-if="!user"
        class="button dark"
        @click="
          authMode = 'login';
          show('auth');
        "
      >
        เข้าสู่ระบบ <ArrowUpRight :size="17" /></button
      ><template v-else
        ><span>{{ user.name }}</span
        ><button class="icon-button" @click="logout" aria-label="ออกจากระบบ">
          <LogOut :size="18" /></button
      ></template>
    </div>
  </div></header>
  <div v-if="offline" class="alert global-alert" role="alert">
    {{ offline }}
    <button class="text-button" @click="boot">ลองเชื่อมต่อใหม่</button>
  </div>
  <Home v-if="route === 'home'" /><Admin v-else-if="route === 'admin'" />
  <main v-else-if="route === 'bookings'" class="page-container">
    <div class="page-title">
      <div>
        <div class="eyebrow green">YOUR NEXT KICK-OFF</div>
        <h1>ตั๋วของฉัน</h1>
        <p>ดูสถานะการชำระเงินและตั๋วเข้าสนามของคุณ</p>
      </div>
      <a class="button dark" href="#home">จองสนามเพิ่ม <Plus :size="18" /></a>
    </div>
    <div v-if="!user && !PREVIEW" class="empty-state">
      <Ticket :size="40" />
      <h2>เข้าสู่ระบบเพื่อดูตั๋วของคุณ</h2>
      <button class="button lime" @click="show('auth')">เข้าสู่ระบบ</button>
    </div>
    <template v-else
      ><p v-if="PREVIEW" class="sample-note">
        ตั๋วด้านล่างเป็นตัวอย่าง ใช้เข้าสนามไม่ได้
      </p>
      <div v-if="!myBookings.length" class="empty-state">
        <Ticket :size="40" />
        <h2>ยังไม่มีการจอง</h2>
        <p>เลือกสนามและเวลาที่คุณต้องการ แล้วนัดทีมได้เลย</p>
        <a href="#home" class="button lime">เลือกสนาม</a>
      </div>
      <div class="my-tickets">
        <article v-for="b in myBookings" :key="b.code" class="booking-ticket">
          <div class="ticket-left">
            <div class="eyebrow green">NO.1 SPORTS / MATCH PASS</div>
            <h2>{{ b.field_name }}</h2>
            <p>
              {{ displayDate(b.booking_date) }} · {{ hour(b.start_hour) }}–{{
                hour(b.end_hour)
              }}
            </p>
            <small>{{ b.code }}</small>
          </div>
          <div class="ticket-right">
            <span :class="['status', b.status]">{{ labels[b.status] }}</span
            ><strong>฿{{ money(b.amount) }}</strong
            ><button class="button dark" @click="openBooking(b)">
              {{
                b.status === "pending_payment" ? "ชำระเงิน" : "ดูรายละเอียด"
              }}
              <ArrowUpRight :size="17" />
            </button>
          </div>
        </article></div
    ></template>
  </main>
  <main v-else class="page-container empty-state">
    <h1>ไม่พบหน้าที่ต้องการ</h1>
    <a href="#home" class="button dark">กลับหน้าแรก</a>
  </main>
  <footer>
    <div class="footer-top">
      <a href="#home" class="brand"
        ><span class="brand-symbol">1<span>★</span></span
        ><span>NO.1 <b>SPORTS</b><small>THE HOME OF YOUR GAME</small></span></a
      >
      <p>ทุกเกมดี ๆ เริ่มต้นที่นี่</p>
      <div><Clock3 :size="17" /> เปิดทุกวัน 09:00–23:00</div>
    </div>
    <div v-if="settings.address || settings.contact" class="footer-contact">
      <span>{{ settings.address }}</span
      ><span>{{ settings.contact }}</span>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} No.1 Sports</span
      ><a v-if="canAdmin" href="#admin">สำหรับผู้ดูแลสนาม</a
      ><a
        href="https://unsplash.com/photos/K5ChxJaheKI"
        target="_blank"
        rel="noreferrer"
        >ภาพประกอบ: Izuddin Helmi Adnan / Unsplash</a
      >
    </div>
  </footer>
  <nav class="mobile-nav">
    <a href="#home" :class="{ active: route === 'home' }"><CalendarDays :size="20" />จองสนาม</a
    ><a href="#bookings" :class="{ active: route === 'bookings' }"><Ticket :size="20" />ตั๋วของฉัน</a
    ><a v-if="canAdmin" href="#admin" :class="{ active: route === 'admin' }"><Settings2 :size="20" />แอดมิน</a
    ><button v-else @click="show('auth')"><Users :size="20" />บัญชี</button>
  </nav>
  <div v-if="notice" class="toast" role="status">
    <CheckCircle2 :size="18" />{{ notice }}
  </div>
  <Modals />
</template>
