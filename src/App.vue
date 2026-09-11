<script setup>
import { reveal as vReveal } from "./motion";
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
  Languages,
  Moon,
  Sun,
} from "lucide-vue-next";
import Home from "./Home.vue";
import Admin from "./Admin.vue";
import Modals from "./Modals.vue";
import PageEffects from "./PageEffects.vue";
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
  loyalty,
  loyaltyHistory,
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
  mapUrl,
  mapEmbedUrl,
  isMapLink,
  labels,
  navigate,
  locale,
  theme,
  toggleLocale,
  toggleTheme,
  t,
} from "./state";
let timer;
const lifecycle = new AbortController();
function hashChange() {
  const destination = location.hash.slice(1) || "home";
  if (route.value !== destination) navigate(destination);
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
  <PageEffects />
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
      <a :class="{ active: route === 'home' }" href="#home">{{ t("หน้าแรก", "Home") }}</a
      ><a href="#home" @click.prevent="scrollBooking">{{ t("จองสนาม", "Book a field") }}</a
      ><a :class="{ active: route === 'bookings' }" href="#bookings"
        >{{ t("ตั๋วของฉัน", "My tickets") }}</a
      ><a :class="{ active: route === 'loyalty' }" href="#loyalty"
        >{{ t("แต้มสะสม", "Loyalty points") }}</a
      ><a v-if="isAdmin" href="#admin">{{ t("จัดการสนาม", "Manage fields") }}</a>
    </nav>
    <div class="nav-user">
      <button class="nav-tool" @click="toggleLocale" :aria-label="t('เปลี่ยนเป็นภาษาอังกฤษ', 'Switch to Thai')">
        <Languages :size="16" /><span>{{ locale === "th" ? "EN" : "ไทย" }}</span>
      </button>
      <button class="nav-tool" @click="toggleTheme" :aria-label="t('เปิดโหมดมืด', 'Switch to light theme')">
        <Sun v-if="theme === 'dark'" :size="17" /><Moon v-else :size="17" />
      </button>
      <button
        v-if="!user"
        class="button dark"
        @click="
          authMode = 'login';
          show('auth');
        "
      >
        {{ t("เข้าสู่ระบบ", "Log in") }} <ArrowUpRight :size="17" /></button
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
  <div :key="route" class="route-view">
  <Home v-if="route === 'home'" /><Admin v-else-if="route === 'admin'" />
  <main v-else-if="route === 'bookings'" class="page-container">
    <div v-reveal class="page-title">
      <div>
        <div class="eyebrow green">YOUR NEXT KICK-OFF</div>
        <h1>{{ t("ตั๋วของฉัน", "My tickets") }}</h1>
        <p>{{ t("ดูสถานะการชำระเงินและตั๋วเข้าสนามของคุณ", "View your payment status and tickets.") }}</p>
      </div>
      <a class="button dark" href="#home">{{ t("จองสนามเพิ่ม", "Book another field") }} <Plus :size="18" /></a>
    </div>
    <div v-if="!user && !PREVIEW" class="empty-state">
      <Ticket :size="40" />
      <h2>{{ t("เข้าสู่ระบบเพื่อดูตั๋วของคุณ", "Log in to view your tickets") }}</h2>
      <button class="button lime" @click="show('auth')">{{ t("เข้าสู่ระบบ", "Log in") }}</button>
    </div>
    <template v-else
      ><p v-if="PREVIEW" class="sample-note">
        ตั๋วด้านล่างเป็นตัวอย่าง ใช้เข้าสนามไม่ได้
      </p>
      <div v-if="!myBookings.length" class="empty-state">
        <Ticket :size="40" />
        <h2>{{ t("ยังไม่มีการจอง", "No bookings yet") }}</h2>
        <p>{{ t("เลือกสนามและเวลาที่คุณต้องการ แล้วนัดทีมได้เลย", "Choose a field and time, then bring your team together.") }}</p>
        <a href="#home" class="button lime">{{ t("เลือกสนาม", "Choose a field") }}</a>
      </div>
      <div class="my-tickets">
        <article v-for="(b, index) in myBookings" :key="b.code" v-reveal="index * 65" class="booking-ticket">
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
                b.status === "pending_payment" ? t("ชำระเงิน", "Pay now") : t("ดูรายละเอียด", "View details")
              }}
              <ArrowUpRight :size="17" />
            </button>
          </div>
        </article></div
    ></template>
  </main>
  <main v-else-if="route === 'loyalty'" class="page-container loyalty-page">
    <div v-if="!user && !PREVIEW" class="empty-state">
      <Ticket :size="40" />
      <h2>{{ t("เข้าสู่ระบบเพื่อดูแต้มสะสม", "Log in to view your points") }}</h2>
      <button class="button lime" @click="show('auth')">{{ t("เข้าสู่ระบบ", "Log in") }}</button>
    </div>
    <template v-else>
      <div class="page-title"><div><div class="eyebrow green">NO.1 SPORTS / LOYALTY</div><h1>{{ t("แต้มสะสมของฉัน", "My loyalty points") }}</h1><p>{{ t("รับแต้มหลังใช้สนาม และใช้เป็นส่วนลดการจองครั้งถัดไป", "Earn points after playing and use them on your next booking") }}</p></div></div>
      <div class="loyalty-balance">
        <div><span>{{ t("แต้มคงเหลือ", "Available points") }}</span><strong>{{ loyalty.balance }}</strong></div>
        <div><span>{{ t("ส่วนลดสูงสุดต่อการจอง", "Maximum discount per booking") }}</span><strong>{{ loyalty.discount_cap_percent }}%</strong></div>
        <p>{{ t("ทุก", "Every") }} ฿{{ money(loyalty.unit_amount) }} {{ t("ที่ชำระจริง รับ", "paid earns") }} {{ loyalty.points_per_unit }} {{ t("แต้ม · 1 แต้มลด 1 บาท", "points · 1 point saves 1 baht") }}</p>
      </div>
      <section class="panel padding"><h2>{{ t("ประวัติแต้ม", "Points history") }}</h2><div v-if="!loyaltyHistory.length" class="empty-state"><p>{{ t("ยังไม่มีรายการแต้ม", "No points activity yet") }}</p></div><div v-else class="loyalty-history"><article v-for="item in loyaltyHistory" :key="item.id"><div><b>{{ item.reason }}</b><small>{{ item.code ? item.code + ' · ' : '' }}{{ item.created_at }}</small></div><strong :class="item.points > 0 ? 'positive' : 'negative'">{{ item.points > 0 ? '+' : '' }}{{ item.points }}</strong><span>{{ item.balance_after }} {{ t("แต้มคงเหลือ", "balance") }}</span></article></div></section>
    </template>
  </main>
  <main v-else class="page-container empty-state">
    <h1>{{ t("ไม่พบหน้าที่ต้องการ", "Page not found") }}</h1>
    <a href="#home" class="button dark">{{ t("กลับหน้าแรก", "Back home") }}</a>
  </main>
  </div>
  <footer>
    <div class="footer-top">
      <a href="#home" class="brand"
        ><span class="brand-symbol">1<span>★</span></span
        ><span>NO.1 <b>SPORTS</b><small>THE HOME OF YOUR GAME</small></span></a
      >
      <p>{{ t("ทุกเกมดี ๆ เริ่มต้นที่นี่", "Every good game starts here") }}</p>
      <div><Clock3 :size="17" /> {{ t("เปิดทุกวัน 09:00–23:00", "Open daily 09:00–23:00") }}</div>
    </div>
    <div v-if="settings.address || settings.contact" class="footer-contact">
      <div v-if="settings.address && isMapLink(settings.address)" class="footer-map">
        <iframe
          :src="mapEmbedUrl(settings.address)"
          title="แผนที่ไปสนาม No.1 Sports"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <a class="button outline compact" :href="mapUrl(settings.address)" target="_blank" rel="noopener">
          {{ t("เปิดแผนที่ใน Google Maps", "Open in Google Maps") }} <ArrowUpRight :size="15" />
        </a>
      </div>
      <span v-else-if="settings.address">{{ settings.address }}</span
      ><span>{{ settings.contact }}</span>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} No.1 Sports</span
      ><a v-if="canAdmin" href="#admin">{{ t("สำหรับผู้ดูแลสนาม", "For field staff") }}</a
      ><a
        href="https://unsplash.com/photos/K5ChxJaheKI"
        target="_blank"
        rel="noreferrer"
        >ภาพประกอบ: Izuddin Helmi Adnan / Unsplash</a
      >
    </div>
  </footer>
  <nav class="mobile-nav">
    <a href="#home" :class="{ active: route === 'home' }"><CalendarDays :size="20" />{{ t("จองสนาม", "Book") }}</a
    ><a href="#bookings" :class="{ active: route === 'bookings' }"><Ticket :size="20" />{{ t("ตั๋วของฉัน", "Tickets") }}</a
    ><a href="#loyalty" :class="{ active: route === 'loyalty' }"><Trophy :size="20" />{{ t("แต้ม", "Points") }}</a
    ><a v-if="canAdmin" href="#admin" :class="{ active: route === 'admin' }"><Settings2 :size="20" />{{ t("แอดมิน", "Admin") }}</a
    ><button v-else @click="show('auth')"><Users :size="20" />{{ t("บัญชี", "Account") }}</button>
  </nav>
  <Transition name="notification">
  <div v-if="notice" class="toast" role="status">
    <CheckCircle2 :size="18" />{{ notice }}
  </div>
  </Transition>
  <Modals />
</template>
