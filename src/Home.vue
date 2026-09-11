<script setup>
import { computed } from "vue";
import { scrollBehavior, reveal as vReveal, spotlight as vSpotlight } from "./motion";
function exploreVenue() { document.getElementById("facilities")?.scrollIntoView({ behavior: scrollBehavior() }); }
import {
  ArrowUpRight,
  ArrowRight,
  Clock3,
  CalendarDays,
  Trophy,
  ShieldCheck,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleDot,
  Shirt,
  Users,
  Zap,
  CircleHelp,
  Share2,
  Sparkles,
} from "lucide-vue-next";
import {
  PREVIEW,
  settings,
  fields,
  selectedDate,
  selectedField,
  duration,
  selectedHour,
  promoCode,
  promoApplied,
  promoSavings,
  today,
  dates,
  slotPage,
  calendarMax,
  chosenField,
  available,
  lastSync,
  loading,
  hours,
  slotState,
  total,
  user,
  money,
  hour,
  displayDate,
  startBooking,
  scrollBooking,
  shareBooking,
  t,
  locale,
} from "./state";
const facilities = computed(() =>
  settings.value.facilities.split("\n").filter(Boolean),
);
const progress = computed(() => [
  { label: t("เลือกวัน", "Choose date"), done: Boolean(selectedDate.value) },
  { label: t("เลือกสนาม", "Choose field"), done: Boolean(chosenField.value) },
  { label: t("เลือกเวลา", "Choose time"), done: selectedHour.value !== null },
]);
const progressPercent = computed(
  () => `${(progress.value.filter((step) => step.done).length / 3) * 100}%`,
);
</script>
<template>
  <main>
    <section
      v-spotlight
      class="hero"
      style="
        background-image:
          linear-gradient(90deg, rgba(6, 24, 18, 0.94), rgba(6, 24, 18, 0.14)),
          url(&quot;./field.jpg&quot;);
      "
    >
      <div class="hero-content">
        <div v-reveal class="hero-copy">
          <div class="eyebrow">
            <span class="live-dot"></span> BOOK. PLAY. REPEAT.
          </div>
          <h1>{{ t("เกมต่อไป", "Your next game") }}<br />{{ t("เริ่มที่", "starts") }}<span>{{ t("นี่", "here") }}</span></h1>
          <p>{{ t("เลือกสนาม เช็กเวลาว่าง และล็อกคิวของทีมคุณได้ในไม่กี่ขั้นตอน", "Choose a field, check availability, and lock in your team's slot in a few steps.") }}</p>
          <div class="hero-actions">
            <button type="button" class="button lime" @click="scrollBooking">{{ t("หาเวลาลงสนาม", "Find your kick-off") }} <ArrowUpRight :size="20" /></button>
            <button type="button" class="hero-explore" @click="exploreVenue">{{ t("สำรวจสนาม", "Explore the venue") }} <ArrowRight :size="17" /></button>
          </div>
          <div class="hero-details">
            <span><Clock3 :size="18" /> {{ t("เปิดทุกวัน 09:00–23:00", "Open daily 09:00–23:00") }}</span>
            <span><ShieldCheck :size="18" /> {{ t("ยืนยันโดยผู้ดูแลสนาม", "Verified by field staff") }}</span>
          </div>
        </div>
        <div v-reveal="120" class="quick-book" aria-label="เริ่มเลือกสนาม">
          <div class="quick-head">
            <span>QUICK BOOKING</span>
            <b><span class="live-dot"></span>{{ available ? "พร้อมจอง" : "กำลังอัปเดต" }}</b>
          </div>
          <h2>{{ t("จัดเกมของคุณ", "Build your game") }}</h2>
          <div class="quick-grid">
            <label>
                <span>{{ t("วันที่", "Date") }}</span>
              <input type="date" v-model="selectedDate" :min="today" :max="calendarMax" />
            </label>
            <label>
                <span>{{ t("สนาม", "Field") }}</span>
              <select v-model.number="selectedField">
                <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </label>
            <label>
                <span>{{ t("ระยะเวลา", "Duration") }}</span>
              <select v-model.number="duration">
                <option v-for="n in 4" :key="n" :value="n">{{ n }} {{ t("ชั่วโมง", "hour(s)") }}</option>
              </select>
            </label>
          </div>
          <button @click="scrollBooking" class="button lime full-width">
            {{ t("ดูเวลาว่าง", "View availability") }} <ArrowUpRight :size="20" />
          </button>
          <small>{{ t("เลือกเวลาและยืนยันการจองในขั้นตอนถัดไป", "Choose a time and confirm in the next step") }}</small>
        </div>
      </div>
      <div class="hero-caption">
        THE PITCH IS YOURS.<span>{{ t("ภาพประกอบ • ไม่ใช่ภาพสถานที่จริง", "Illustration • not the actual venue") }}</span>
      </div>
      <div class="hero-number">01 <span>/ YOUR HOME GROUND</span></div>
    </section>
    <div class="benefit-strip">
      <span><CalendarDays :size="19" /> {{ t("เลือกวันและเวลาได้เอง", "Choose your date and time") }}</span
      ><span><ShieldCheck :size="19" /> {{ t("ตรวจสอบสลิปโดยผู้ดูแล", "Slip checked by staff") }}</span
      ><span><Ticket :size="19" /> {{ t("แสดงตั๋ว QR ก่อนลงสนาม", "Show your QR ticket at entry") }}</span>
    </div>
    <section class="booking-section" id="booking">
      <div v-reveal class="section-head">
        <div>
          <div class="eyebrow green">FIND YOUR NEXT GAME</div>
          <h2>{{ t("เลือกสนาม นัดทีม แล้วลุย", "Choose a field, bring your team") }}</h2>
        </div>
        <span class="sync" :class="{ disconnected: !available }"
          ><span class="live-dot"></span
          >{{
            PREVIEW
              ? t("ตารางตัวอย่าง", "Demo schedule")
              : available
                ? t("อัปเดตทุก 5 วินาที", "Updates every 5 seconds")
                : t("กำลังเชื่อมต่อ", "Connecting")
          }}<small v-if="lastSync">{{ lastSync }}</small></span
        >
      </div>
      <div class="booking-layout">
        <div class="booking-main">
          <div class="calendar-toolbar">
            <strong><CalendarDays :size="18" /> {{ t("เลือกวันที่ลงสนาม", "Choose a date") }}</strong>
            <div class="calendar-controls">
              <label class="sr-only" for="date-picker">{{ t("เลือกวันจอง", "Choose booking date") }}</label
              ><input
                id="date-picker"
                type="date"
                v-model="selectedDate"
                :min="today"
                :max="calendarMax"
              /><button
                class="icon-button"
                :disabled="slotPage === 0"
                @click="slotPage--"
                aria-label="สัปดาห์ก่อน"
              >
                <ChevronLeft :size="19" /></button
              ><button
                class="icon-button"
                :disabled="slotPage >= 12"
                @click="slotPage++"
                aria-label="สัปดาห์ถัดไป"
              >
                <ChevronRight :size="19" />
              </button>
            </div>
          </div>
          <div class="date-cards">
            <button
              v-for="date in dates"
              :key="date"
              :class="['date-card', { selected: selectedDate === date }]"
              :aria-pressed="selectedDate === date"
              @click="selectedDate = date"
            >
              <small>{{
                  date === today
                  ? t("วันนี้", "Today")
                  : new Date(date + "T12:00:00+07:00").toLocaleDateString(
                    locale === "th" ? "th-TH" : "en-US",
                      { weekday: "short" },
                    )
              }}</small
              ><b>{{ Number(date.slice(-2)) }}</b
              ><span>{{
                new Date(date + "T12:00:00+07:00").toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                  month: "short",
                })
              }}</span>
            </button>
          </div>
          <div v-if="loading" class="field-loading" role="status" aria-live="polite">
            <div class="skeleton-grid" aria-hidden="true"><div v-for="n in 3" :key="n" class="skeleton-card"><div></div><span></span><span></span></div></div>
            <p>{{ t("กำลังโหลดสนาม…", "Loading fields...") }}</p>
          </div>
          <div v-else-if="!fields.length" class="empty-state">
            <CalendarDays :size="35" />
            <h3>{{ t("กำลังเตรียมสนามให้คุณ", "Fields are being prepared") }}</h3>
            <p>{{ t("เมื่อสนามเปิดจอง คุณจะเลือกวันและเวลาที่นี่ได้", "You can choose a date and time here when booking opens.") }}</p>
          </div>
          <div v-if="fields.length" class="booking-progress" aria-label="ขั้นตอนการจอง">
            <div class="progress-copy">
              <Sparkles :size="18" />
              <span>
                <strong>{{ progress.every((step) => step.done) ? t("พร้อมจองแล้ว", "Ready to book") : t("วางแผนเกมของคุณ", "Plan your game") }}</strong>
                <small>{{ t("เลือกวัน สนาม และเวลาให้ครบ", "Choose a date, field, and time") }}</small>
              </span>
            </div>
            <div class="progress-steps">
              <span v-for="(step, index) in progress" :key="step.label" :class="{ done: step.done }">
                <b>{{ step.done ? "✓" : index + 1 }}</b>{{ step.label }}
              </span>
            </div>
            <button type="button" class="share-button" @click="shareBooking">
              <Share2 :size="16" /> {{ t("ชวนเพื่อน", "Invite friends") }}
            </button>
            <div class="progress-line" aria-hidden="true">
              <span :style="{ width: progressPercent }"></span>
            </div>
          </div>
          <div class="field-cards">
            <button
              v-for="(f, i) in fields"
              :key="f.id"
              v-reveal="i * 70"
              :aria-pressed="Number(chosenField?.id) === Number(f.id)"
              :class="[
                'field-card',
                { selected: Number(chosenField?.id) === Number(f.id) },
              ]"
              @click="selectedField = f.id"
            >
              <div class="field-photo">
                <img
                  :src="f.image_url || './field.jpg'"
                  :alt="f.name"
                  loading="lazy"
                  decoding="async"
                  :style="{ objectPosition: `${30 + i * 25}% center` }"
                /><span class="field-tag">{{
                  PREVIEW ? t("สนามตัวอย่าง", "Demo field") : t("เปิดให้จอง", "Available")
                }}</span
                ><span
                  v-if="Number(chosenField?.id) === Number(f.id)"
                  class="selected-check"
                  ><Check :size="15"
                /></span>
              </div>
              <div class="field-info">
                <h3>{{ f.name }}</h3>
                <p>{{ f.description }}</p>
                <div>
                  <strong>฿{{ money(f.price) }}</strong
                  ><span> / {{ t("ชั่วโมง", "hour") }}</span><ArrowUpRight :size="20" />
                </div>
              </div>
            </button>
          </div>
          <div v-if="chosenField" class="time-section">
            <div class="time-heading">
              <strong><Clock3 :size="18" /> {{ t("เวลาที่ต้องการเล่น", "Choose a time") }}</strong
              ><label
                >{{ t("ระยะเวลา", "Duration") }}
                <select v-model.number="duration">
                  <option v-for="n in 4" :value="n">{{ n }} {{ t("ชั่วโมง", "hour") }}</option>
                </select></label
              >
            </div>
            <div class="time-grid">
              <button
                v-for="h in hours"
                :key="h"
                :aria-pressed="selectedHour === h"
                :disabled="slotState(h) !== 'free'"
                :class="[
                  'time-slot',
                  slotState(h),
                  { selected: selectedHour === h },
                ]"
                @click="selectedHour = h"
              >
                <b>{{ hour(h) }}</b
                ><small>{{
                  slotState(h) === "full"
                    ? t("เต็มแล้ว", "Full")
                    : slotState(h) === "past"
                      ? t("ผ่านเวลาแล้ว", "Passed")
                      : slotState(h) === "closed"
                        ? t("เกินเวลาปิด", "Closed")
                        : slotState(h) === "unknown"
                          ? t("รออัปเดต", "Updating")
                          : selectedHour === h
                            ? t("เลือกแล้ว", "Selected")
                            : t("ว่าง", "Available")
                }}</small>
              </button>
            </div>
            <p class="small muted">
              {{ t("เวลาที่เลือกคือเวลาเริ่มเล่น", "Selected time is your start time") }} • {{ duration }} {{ t("ชั่วโมง", "hour(s)") }} • {{ t("ปิดสนาม 23:00 น.", "Closes at 23:00") }}
            </p>
          </div>
        </div>
        <aside class="booking-summary">
          <div class="eyebrow green">YOUR GAME PLAN</div>
          <h3>{{ t("สรุปการจอง", "Booking summary") }}</h3>
          <div class="summary-icon"><CalendarDays :size="24" /></div>
          <dl>
            <div>
              <dt>{{ t("สนาม", "Field") }}</dt>
              <dd>{{ chosenField?.name || t("ยังไม่ได้เลือก", "Not selected") }}</dd>
            </div>
            <div>
              <dt>{{ t("วันที่", "Date") }}</dt>
              <dd>{{ displayDate(selectedDate, true) }}</dd>
            </div>
            <div>
              <dt>{{ t("เวลา", "Time") }}</dt>
              <dd>
                {{
                  selectedHour === null
                    ? t("เลือกเวลาด้านซ้าย", "Choose a time on the left")
                    : `${hour(selectedHour)} – ${hour(selectedHour + duration)}`
                }}
              </dd>
            </div>
            <div>
              <dt>{{ t("ระยะเวลา", "Duration") }}</dt>
              <dd>{{ duration }} {{ t("ชั่วโมง", "hour(s)") }}</dd>
            </div>
          </dl>
          <div class="total-row">
            <span>{{ t("ยอดชำระทั้งหมด", "Total") }}</span><strong>฿{{ money(total) }}</strong>
          </div>
          <label class="promo-input">
            {{ t("โค้ดโปรโมชั่น", "Promo code") }}
            <input
              v-model="promoCode"
              type="text"
              maxlength="40"
              autocomplete="off"
              :placeholder="t('ถ้ามีโค้ด เช่น No.1Sports', 'If you have one, e.g. No.1Sports')"
            />
          </label>
          <p v-if="promoApplied" class="promo-applied" role="status">
            ใช้โค้ด {{ settings.promotion_code }} แล้ว ลด {{ settings.promotion_percent }}% (ประหยัด ฿{{ money(promoSavings) }})
          </p>
          <button
            class="button lime full-width"
            :disabled="
              selectedHour === null ||
              !available ||
              (!PREVIEW && !settings.booking_enabled)
            "
            @click="startBooking"
          >
            {{ user ? t("จองสนามนี้", "Book this field") : t("เข้าสู่ระบบเพื่อจอง", "Log in to book") }}
            <ArrowRight :size="19" />
          </button>
          <p class="small muted center">
            <ShieldCheck :size="14" /> ล็อกอินก่อนจอง • รับตั๋วหลังตรวจสลิป
          </p>
          <div v-if="PREVIEW" class="sample-note">
            {{ t("สนามและราคาเป็นข้อมูลตัวอย่าง", "Fields and prices are demo data") }}<br />{{ t("ผู้ดูแลเปลี่ยนเป็นข้อมูลจริงได้", "Staff can replace them with real details") }}
          </div>
          <div v-else-if="!settings.booking_enabled" class="sample-note">
            {{ t("ขณะนี้ยังไม่เปิดรับจอง", "Booking is currently closed") }}
          </div>
        </aside>
      </div>
    </section>
    <section v-reveal class="promotion-section">
      <div>
        <span class="eyebrow">GOOD GAMES. GREAT TIMES.</span>
        <h2>{{ t("ชวนเพื่อนให้ครบ", "Bring the whole team") }}<br />{{ t("แล้วพบกันที่สนาม", "and meet us on the pitch") }}</h2>
        <p class="preline">
          {{ settings.promotion || t("ติดตามโปรโมชั่นของสนามได้ที่นี่", "Follow the latest field promotions here") }}
        </p>
      </div>
      <div class="promo-mark">
        LET’S<br /><span>PLAY.</span><ArrowUpRight :size="64" />
      </div>
    </section>
    <section class="iso-section" aria-labelledby="iso-title">
      <div v-reveal class="iso-intro">
        <div class="eyebrow green">PROJECT QUALITY FRAMEWORK</div>
        <h2 id="iso-title">{{ t("ประยุกต์ใช้ ISO/IEC 29110 กับโครงการ", "Applying ISO/IEC 29110 to the project") }}</h2>
        <p>
          {{ t("โครงการใช้แนวทาง Basic Profile สำหรับทีมพัฒนาขนาดเล็ก เพื่อให้การพัฒนา การทดสอบ และการส่งมอบระบบจองสนามตรวจสอบย้อนกลับได้", "The project follows the Basic Profile for small development teams so that field booking development, testing, and delivery remain traceable.") }}
        </p>
        <span class="iso-note">{{ t("อ้างอิงแนวทางและหลักฐานการดำเนินงานในเอกสารโครงการ", "See the project document for the framework and evidence") }}</span>
      </div>
      <div v-reveal="80" class="iso-practices">
        <article>
          <ShieldCheck :size="23" />
          <div>
            <h3>Project Management</h3>
            <p>{{ t("กำหนดขอบเขต บทบาท ความเสี่ยง การเปลี่ยนแปลง และเกณฑ์รับมอบ", "Defines scope, roles, risks, changes, and acceptance criteria") }}</p>
          </div>
        </article>
        <article>
          <Check :size="23" />
          <div>
            <h3>Software Implementation</h3>
            <p>{{ t("ผูกความต้องการกับการออกแบบ โค้ด การทดสอบ และหลักฐานการส่งมอบ", "Connects requirements to design, code, tests, and delivery evidence") }}</p>
          </div>
        </article>
        <article>
          <Ticket :size="23" />
          <div>
            <h3>{{ t("คุณภาพและความปลอดภัย", "Quality and security") }}</h3>
            <p>{{ t("ตรวจสิทธิ์ CSRF ราคา การจองซ้ำ การชำระเงิน และการเช็คอินก่อนปล่อยใช้", "Checks access, CSRF, pricing, duplicate bookings, payments, and check-in before release") }}</p>
          </div>
        </article>
      </div>
    </section>
    <section class="facilities-section" id="facilities">
      <div v-reveal class="facilities-intro">
        <div class="eyebrow green">MORE THAN A PITCH</div>
        <h2>{{ t("เตรียมทีมมา", "Bring your team") }}<br />{{ t("แล้วสนุกกับเกม", "and enjoy the game") }}</h2>
        <p>
          {{
            PREVIEW
              ? t("ตัวอย่างสิ่งอำนวยความสะดวกและอุปกรณ์ให้ยืม ปรับรายการจริงได้ในหน้าแอดมิน", "Demo facilities and equipment. Update the real list in Admin.")
              : t("สิ่งอำนวยความสะดวกและอุปกรณ์ของสนาม", "Field facilities and equipment")
          }}
        </p>
      </div>
      <div v-if="facilities.length" class="facilities-grid">
        <div v-for="(item, i) in facilities" :key="item" v-reveal="i * 70">
          <component :is="[CircleDot, Shirt, Users, Zap][i % 4]" :size="25" />
          <h3>{{ item }}</h3>
        </div>
      </div>
      <p v-else class="muted">{{ t("ผู้ดูแลกำลังอัปเดตรายละเอียดสิ่งอำนวยความสะดวก", "The staff is updating facility details") }}</p>
    </section>
    <section class="how-section">
      <div class="section-head">
        <div>
          <div class="eyebrow green">FROM BOOKING TO KICK-OFF</div>
          <h2>{{ t("จองง่าย พร้อมลงสนาม", "Book easily, play sooner") }}</h2>
        </div>
      </div>
      <div v-reveal class="steps">
        <article>
          <span>01</span>
          <h3>{{ t("เลือกสนามและเวลา", "Choose a field and time") }}</h3>
          <p>{{ t("ดูเวลาว่าง สมัครสมาชิก แล้วล็อกอินเพื่อจอง", "Check availability, sign up, and log in to book") }}</p>
        </article>
        <article>
          <span>02</span>
          <h3>{{ t("โอนเงินและแนบสลิป", "Pay and upload your slip") }}</h3>
          <p>{{ t("ชำระภายใน 15 นาที แล้วส่งสลิปให้ผู้ดูแลตรวจสอบ", "Pay within 15 minutes and send the slip for review") }}</p>
        </article>
        <article>
          <span>03</span>
          <h3>{{ t("รับตั๋ว แล้วมาเจอกัน", "Get your ticket and play") }}</h3>
          <p>{{ t("เมื่อยืนยันแล้ว แสดง QR ให้ผู้ดูแลสแกนก่อนเล่น", "Once confirmed, show your QR code before playing") }}</p>
        </article>
      </div>
      <details class="rules">
        <summary>{{ t("คำแนะนำก่อนลงสนาม", "Before you play") }} <CircleHelp :size="18" /></summary>
        <p class="preline">{{ settings.rules }}</p>
      </details>
    </section>
  </main>
</template>
