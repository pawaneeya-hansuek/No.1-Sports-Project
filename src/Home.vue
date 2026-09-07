<script setup>
import { computed } from "vue";
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
} from "./state";
const facilities = computed(() =>
  settings.value.facilities.split("\n").filter(Boolean),
);
const progress = computed(() => [
  { label: "เลือกวัน", done: Boolean(selectedDate.value) },
  { label: "เลือกสนาม", done: Boolean(chosenField.value) },
  { label: "เลือกเวลา", done: selectedHour.value !== null },
]);
const progressPercent = computed(
  () => `${(progress.value.filter((step) => step.done).length / 3) * 100}%`,
);
</script>
<template>
  <main>
    <section
      class="hero"
      style="
        background-image:
          linear-gradient(90deg, rgba(6, 24, 18, 0.94), rgba(6, 24, 18, 0.14)),
          url(&quot;./field.jpg&quot;);
      "
    >
      <div class="hero-content">
        <div class="hero-copy">
          <div class="eyebrow">
            <span class="live-dot"></span> BOOK. PLAY. REPEAT.
          </div>
          <h1>เกมต่อไป<br />เริ่มที่<span>นี่</span></h1>
          <p>เลือกสนาม เช็กเวลาว่าง และล็อกคิวของทีมคุณได้ในไม่กี่ขั้นตอน</p>
          <div class="hero-details">
            <span><Clock3 :size="18" /> เปิดทุกวัน 09:00–23:00</span>
            <span><ShieldCheck :size="18" /> ยืนยันโดยผู้ดูแลสนาม</span>
          </div>
        </div>
        <div class="quick-book" aria-label="เริ่มเลือกสนาม">
          <div class="quick-head">
            <span>QUICK BOOKING</span>
            <b><span class="live-dot"></span>{{ available ? "พร้อมจอง" : "กำลังอัปเดต" }}</b>
          </div>
          <h2>จัดเกมของคุณ</h2>
          <div class="quick-grid">
            <label>
              <span>วันที่</span>
              <input type="date" v-model="selectedDate" :min="today" :max="calendarMax" />
            </label>
            <label>
              <span>สนาม</span>
              <select v-model.number="selectedField">
                <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </label>
            <label>
              <span>ระยะเวลา</span>
              <select v-model.number="duration">
                <option v-for="n in 4" :key="n" :value="n">{{ n }} ชั่วโมง</option>
              </select>
            </label>
          </div>
          <button @click="scrollBooking" class="button lime full-width">
            ดูเวลาว่าง <ArrowUpRight :size="20" />
          </button>
          <small>เลือกเวลาและยืนยันการจองในขั้นตอนถัดไป</small>
        </div>
      </div>
      <div class="hero-caption">
        THE PITCH IS YOURS.<span>ภาพประกอบ • ไม่ใช่ภาพสถานที่จริง</span>
      </div>
      <div class="hero-number">01 <span>/ YOUR HOME GROUND</span></div>
    </section>
    <div class="benefit-strip">
      <span><CalendarDays :size="19" /> เลือกวันและเวลาได้เอง</span
      ><span><ShieldCheck :size="19" /> ตรวจสอบสลิปโดยผู้ดูแล</span
      ><span><Ticket :size="19" /> แสดงตั๋ว QR ก่อนลงสนาม</span>
    </div>
    <section class="booking-section" id="booking">
      <div class="section-head">
        <div>
          <div class="eyebrow green">FIND YOUR NEXT GAME</div>
          <h2>เลือกสนาม นัดทีม แล้วลุย</h2>
        </div>
        <span class="sync" :class="{ disconnected: !available }"
          ><span class="live-dot"></span
          >{{
            PREVIEW
              ? "ตารางตัวอย่าง"
              : available
                ? "อัปเดตทุก 5 วินาที"
                : "กำลังเชื่อมต่อ"
          }}<small v-if="lastSync">{{ lastSync }}</small></span
        >
      </div>
      <div class="booking-layout">
        <div class="booking-main">
          <div class="calendar-toolbar">
            <strong><CalendarDays :size="18" /> เลือกวันที่ลงสนาม</strong>
            <div class="calendar-controls">
              <label class="sr-only" for="date-picker">เลือกวันจอง</label
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
              @click="selectedDate = date"
            >
              <small>{{
                date === today
                  ? "วันนี้"
                  : new Date(date + "T12:00:00+07:00").toLocaleDateString(
                      "th-TH",
                      { weekday: "short" },
                    )
              }}</small
              ><b>{{ Number(date.slice(-2)) }}</b
              ><span>{{
                new Date(date + "T12:00:00+07:00").toLocaleDateString("th-TH", {
                  month: "short",
                })
              }}</span>
            </button>
          </div>
          <div v-if="loading" class="empty-state">กำลังโหลดสนาม…</div>
          <div v-else-if="!fields.length" class="empty-state">
            <CalendarDays :size="35" />
            <h3>กำลังเตรียมสนามให้คุณ</h3>
            <p>เมื่อสนามเปิดจอง คุณจะเลือกวันและเวลาที่นี่ได้</p>
          </div>
          <div v-if="fields.length" class="booking-progress" aria-label="ขั้นตอนการจอง">
            <div class="progress-copy">
              <Sparkles :size="18" />
              <span>
                <strong>{{ progress.every((step) => step.done) ? "พร้อมจองแล้ว" : "วางแผนเกมของคุณ" }}</strong>
                <small>เลือกวัน สนาม และเวลาให้ครบ</small>
              </span>
            </div>
            <div class="progress-steps">
              <span v-for="(step, index) in progress" :key="step.label" :class="{ done: step.done }">
                <b>{{ step.done ? "✓" : index + 1 }}</b>{{ step.label }}
              </span>
            </div>
            <button type="button" class="share-button" @click="shareBooking">
              <Share2 :size="16" /> ชวนเพื่อน
            </button>
            <div class="progress-line" aria-hidden="true">
              <span :style="{ width: progressPercent }"></span>
            </div>
          </div>
          <div class="field-cards">
            <button
              v-for="(f, i) in fields"
              :key="f.id"
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
                  :style="{ objectPosition: `${30 + i * 25}% center` }"
                /><span class="field-tag">{{
                  PREVIEW ? "สนามตัวอย่าง" : "เปิดให้จอง"
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
                  ><span> / ชั่วโมง</span><ArrowUpRight :size="20" />
                </div>
              </div>
            </button>
          </div>
          <div v-if="chosenField" class="time-section">
            <div class="time-heading">
              <strong><Clock3 :size="18" /> เวลาที่ต้องการเล่น</strong
              ><label
                >ระยะเวลา
                <select v-model.number="duration">
                  <option v-for="n in 4" :value="n">{{ n }} ชั่วโมง</option>
                </select></label
              >
            </div>
            <div class="time-grid">
              <button
                v-for="h in hours"
                :key="h"
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
                    ? "เต็มแล้ว"
                    : slotState(h) === "past"
                      ? "ผ่านเวลาแล้ว"
                      : slotState(h) === "closed"
                        ? "เกินเวลาปิด"
                        : slotState(h) === "unknown"
                          ? "รออัปเดต"
                          : selectedHour === h
                            ? "เลือกแล้ว"
                            : "ว่าง"
                }}</small>
              </button>
            </div>
            <p class="small muted">
              เวลาที่เลือกคือเวลาเริ่มเล่น • {{ duration }} ชั่วโมง • ปิดสนาม
              23:00 น.
            </p>
          </div>
        </div>
        <aside class="booking-summary">
          <div class="eyebrow green">YOUR GAME PLAN</div>
          <h3>สรุปการจอง</h3>
          <div class="summary-icon"><CalendarDays :size="24" /></div>
          <dl>
            <div>
              <dt>สนาม</dt>
              <dd>{{ chosenField?.name || "ยังไม่ได้เลือก" }}</dd>
            </div>
            <div>
              <dt>วันที่</dt>
              <dd>{{ displayDate(selectedDate, true) }}</dd>
            </div>
            <div>
              <dt>เวลา</dt>
              <dd>
                {{
                  selectedHour === null
                    ? "เลือกเวลาด้านซ้าย"
                    : `${hour(selectedHour)} – ${hour(selectedHour + duration)}`
                }}
              </dd>
            </div>
            <div>
              <dt>ระยะเวลา</dt>
              <dd>{{ duration }} ชั่วโมง</dd>
            </div>
          </dl>
          <div class="total-row">
            <span>ยอดชำระทั้งหมด</span><strong>฿{{ money(total) }}</strong>
          </div>
          <label class="promo-input">
            โค้ดโปรโมชั่น
            <input
              v-model="promoCode"
              type="text"
              maxlength="40"
              autocomplete="off"
              placeholder="ถ้ามีโค้ด เช่น No.1Sports"
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
            {{ user ? "จองสนามนี้" : "เข้าสู่ระบบเพื่อจอง" }}
            <ArrowRight :size="19" />
          </button>
          <p class="small muted center">
            <ShieldCheck :size="14" /> ล็อกอินก่อนจอง • รับตั๋วหลังตรวจสลิป
          </p>
          <div v-if="PREVIEW" class="sample-note">
            สนามและราคาเป็นข้อมูลตัวอย่าง<br />ผู้ดูแลเปลี่ยนเป็นข้อมูลจริงได้
          </div>
          <div v-else-if="!settings.booking_enabled" class="sample-note">
            ขณะนี้ยังไม่เปิดรับจอง
          </div>
        </aside>
      </div>
    </section>
    <section class="promotion-section">
      <div>
        <span class="eyebrow">GOOD GAMES. GREAT TIMES.</span>
        <h2>ชวนเพื่อนให้ครบ<br />แล้วพบกันที่สนาม</h2>
        <p class="preline">
          {{ settings.promotion || "ติดตามโปรโมชั่นของสนามได้ที่นี่" }}
        </p>
      </div>
      <div class="promo-mark">
        LET’S<br /><span>PLAY.</span><ArrowUpRight :size="64" />
      </div>
    </section>
    <section class="facilities-section" id="facilities">
      <div class="facilities-intro">
        <div class="eyebrow green">MORE THAN A PITCH</div>
        <h2>เตรียมทีมมา<br />แล้วสนุกกับเกม</h2>
        <p>
          {{
            PREVIEW
              ? "ตัวอย่างสิ่งอำนวยความสะดวกและอุปกรณ์ให้ยืม ปรับรายการจริงได้ในหน้าแอดมิน"
              : "สิ่งอำนวยความสะดวกและอุปกรณ์ของสนาม"
          }}
        </p>
      </div>
      <div v-if="facilities.length" class="facilities-grid">
        <div v-for="(item, i) in facilities" :key="item">
          <component :is="[CircleDot, Shirt, Users, Zap][i % 4]" :size="25" />
          <h3>{{ item }}</h3>
        </div>
      </div>
      <p v-else class="muted">ผู้ดูแลกำลังอัปเดตรายละเอียดสิ่งอำนวยความสะดวก</p>
    </section>
    <section class="how-section">
      <div class="section-head">
        <div>
          <div class="eyebrow green">FROM BOOKING TO KICK-OFF</div>
          <h2>จองง่าย พร้อมลงสนาม</h2>
        </div>
      </div>
      <div class="steps">
        <article>
          <span>01</span>
          <h3>เลือกสนามและเวลา</h3>
          <p>ดูเวลาว่าง สมัครสมาชิก แล้วล็อกอินเพื่อจอง</p>
        </article>
        <article>
          <span>02</span>
          <h3>โอนเงินและแนบสลิป</h3>
          <p>ชำระภายใน 15 นาที แล้วส่งสลิปให้ผู้ดูแลตรวจสอบ</p>
        </article>
        <article>
          <span>03</span>
          <h3>รับตั๋ว แล้วมาเจอกัน</h3>
          <p>เมื่อยืนยันแล้ว แสดง QR ให้ผู้ดูแลสแกนก่อนเล่น</p>
        </article>
      </div>
      <details class="rules">
        <summary>คำแนะนำก่อนลงสนาม <CircleHelp :size="18" /></summary>
        <p class="preline">{{ settings.rules }}</p>
      </details>
    </section>
  </main>
</template>
