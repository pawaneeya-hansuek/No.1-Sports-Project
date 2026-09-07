<script setup>
import { ref, watch, nextTick } from "vue";
import {
  X,
  ArrowRight,
  Upload,
  Copy,
  Ticket,
  Download,
  Check,
  ScanLine,
  Camera,
  Search,
  CheckCircle2,
} from "lucide-vue-next";
import {
  PREVIEW,
  modal,
  busy,
  error,
  authMode,
  auth,
  activeBooking,
  chosenField,
  selectedDate,
  selectedHour,
  duration,
  total,
  settings,
  slip,
  qr,
  reviewNote,
  scanInput,
  scanError,
  video,
  fieldDraft,
  close,
  show,
  authenticate,
  book,
  copyAccount,
  sendSlip,
  cancelBooking,
  action,
  startScanner,
  scanImage,
  lookup,
  saveField,
  uploadField,
  money,
  hour,
  displayDate,
  labels,
} from "./state";
const dialog = ref(null);
watch(modal, async (v) => {
  await nextTick();
  if (v && !dialog.value?.open) dialog.value?.showModal();
  if (!v && dialog.value?.open) dialog.value.close();
});
</script>
<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-label="รายละเอียดและดำเนินการ"
    @cancel.prevent="close"
  >
    <div class="modal-inner">
      <button class="modal-close icon-button" @click="close" aria-label="ปิด">
        <X :size="21" />
      </button>
      <template v-if="modal === 'auth'"
        ><div class="eyebrow green">WELCOME TO NO.1 SPORTS</div>
        <h2>
          {{
            authMode === "login"
              ? "ยินดีต้อนรับกลับสู่สนาม"
              : "พร้อมสำหรับเกมต่อไป?"
          }}
        </h2>
        <p class="muted">
          {{
            authMode === "login"
              ? "เข้าสู่ระบบเพื่อจองสนามและดูตั๋วของคุณ"
              : "สมัครด้วยอีเมลหรือเบอร์โทร พร้อมตั้งรหัสผ่าน"
          }}
        </p>
        <div class="auth-tabs">
          <button
            :class="{ selected: authMode === 'login' }"
            @click="
              authMode = 'login';
              error = '';
            "
          >
            เข้าสู่ระบบ</button
          ><button
            :class="{ selected: authMode === 'register' }"
            @click="
              authMode = 'register';
              error = '';
            "
          >
            สมัครสมาชิก
          </button>
        </div>
        <p v-if="PREVIEW" class="sample-note">
          ตัวอย่างนี้ไม่รับข้อมูลส่วนบุคคลหรือสร้างบัญชีจริง
        </p>
        <form @submit.prevent="authenticate">
          <template v-if="authMode === 'register'"
            ><label
              >ชื่อผู้จอง<input
                v-model="auth.name"
                autocomplete="name"
                required
                maxlength="120"
                :disabled="PREVIEW" /></label
            ><label
              >อีเมล<input
                type="email"
                v-model="auth.email"
                autocomplete="email"
                maxlength="190"
                :disabled="PREVIEW" /></label
            ><label
              >เบอร์โทรศัพท์<input
                type="tel"
                v-model="auth.phone"
                autocomplete="tel"
                pattern="0[0-9]{8,9}"
                maxlength="10"
                :disabled="PREVIEW"
            /></label>
            <p class="small muted">
              กรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่อง
              ข้อมูลนี้ยังไม่ได้ยืนยันด้วย OTP
            </p></template
          ><label v-else
            >อีเมลหรือเบอร์โทร<input
              v-model="auth.identity"
              autocomplete="username"
              required
              :disabled="PREVIEW" /></label
          ><label
            >รหัสผ่าน<input
              type="password"
              v-model="auth.password"
              :autocomplete="
                authMode === 'register' ? 'new-password' : 'current-password'
              "
              :minlength="authMode === 'register' ? 12 : 1"
              maxlength="72"
              required
              :disabled="PREVIEW"
          /></label>
          <p v-if="authMode === 'register'" class="small muted">
            ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร
            ข้อมูลติดต่อใช้จัดการการจองและให้ผู้ดูแลสนามติดต่อคุณ
          </p>
          <button class="button dark full-width" :disabled="busy || PREVIEW">
            {{
              busy
                ? "กำลังดำเนินการ…"
                : authMode === "login"
                  ? "เข้าสู่ระบบ"
                  : "สร้างบัญชี"
            }}
            <ArrowRight :size="18" />
          </button></form
      ></template>
      <template v-if="modal === 'confirm'"
        ><div class="eyebrow green">ONE STEP CLOSER TO THE GAME</div>
        <h2>ยืนยันการจองสนาม</h2>
        <h3>{{ chosenField?.name }}</h3>
        <p>
          {{ displayDate(selectedDate) }}<br />{{ hour(selectedHour) }}–{{
            hour(selectedHour + duration)
          }}
          · {{ duration }} ชั่วโมง
        </p>
        <div class="total-row">
          <span>ยอดโอน</span><strong>฿{{ money(total) }}</strong>
        </div>
        <div class="sample-note">
          ระบบกันเวลาไว้ 15 นาทีเพื่อโอนเงินและแนบสลิป หากไม่แนบสลิปทันเวลา
          ระบบจะคืนช่วงเวลาให้ผู้จองอื่น
        </div>
        <button class="button lime full-width" :disabled="busy" @click="book">
          ยืนยันและไปชำระเงิน <ArrowRight :size="18" /></button
      ></template>
      <template v-if="modal === 'payment' && activeBooking?.status === 'pending_payment'"
        ><div class="eyebrow green">PAYMENT</div>
        <h2>ชำระเงินเพื่อยืนยันการจอง</h2>
        <p>
          {{ activeBooking.field_name }} ·
          {{ displayDate(activeBooking.booking_date, true) }} ·
          {{ hour(activeBooking.start_hour) }}–{{
            hour(activeBooking.end_hour)
          }}
        </p>
        <p class="status pending_payment">
          แนบสลิปก่อน {{ activeBooking.expires_at?.slice(11, 16) }} น.
        </p>
        <div class="bank-box">
          <span class="bank-logo">K</span>
          <div>
            <b>{{ settings.bank_name }}</b
            ><strong>{{ settings.bank_account }}</strong
            ><span>{{ settings.bank_holder }}</span>
          </div>
          <button
            class="icon-button"
            @click="copyAccount"
            aria-label="คัดลอกบัญชี"
          >
            <Copy :size="19" />
          </button>
        </div>
        <img
          v-if="settings.payment_qr"
          class="payment-qr"
          :src="settings.payment_qr"
          alt="QR สำหรับโอนเงินเข้าบัญชีสนาม"
        />
        <p v-else class="sample-note">
          ยังไม่มี QR รับเงิน กรุณาโอนผ่านเลขบัญชีด้านบน
        </p>
        <div class="total-row">
          <span>ยอดที่ต้องโอน</span
          ><strong>฿{{ money(activeBooking.amount) }}</strong>
        </div>
        <p class="small muted">
          ตรวจชื่อผู้รับและยอดเงินในแอปธนาคารก่อนโอน
          แอดมินจะตรวจยอดเข้าบัญชีก่อนออกตั๋ว
        </p>
        <form @submit.prevent="sendSlip">
          <label class="upload-box"
            ><Upload :size="25" />{{ slip ? slip.name : "แนบสลิปโอนเงิน"
            }}<input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              @change="slip = $event.target.files[0]"
          /></label>
          <p class="small muted">JPG, PNG หรือ WebP ไม่เกิน 5 MB</p>
          <button
            class="button dark full-width"
            :disabled="
              busy || !slip || activeBooking.status !== 'pending_payment'
            "
          >
            ส่งสลิปให้ผู้ดูแลตรวจ <ArrowRight :size="18" />
          </button>
        </form>
        <p v-if="activeBooking.status !== 'pending_payment'" class="alert">
          {{ labels[activeBooking.status] }} หากโอนแล้วให้ติดต่อสนาม
        </p>
        <button class="text-button danger" @click="show('cancel')">
          ยังไม่ได้โอนเงิน ต้องการยกเลิก
        </button></template
      >
      <template v-if="modal === 'cancel'"
        ><h2>ยกเลิกการจองนี้?</h2>
        <p>
          ช่วงเวลาจะถูกคืนให้ผู้อื่นจอง
          หากโอนเงินแล้วให้กลับไปแนบสลิปหรือติดต่อสนาม
        </p>
        <div class="action-row">
          <button class="button outline" @click="show('payment')">
            กลับไปชำระ</button
          ><button
            class="button danger-fill"
            :disabled="busy"
            @click="cancelBooking"
          >
            ยืนยันยกเลิก
          </button>
        </div></template
      >
      <template v-if="activeBooking && (modal === 'ticket' || (modal === 'payment' && activeBooking.status !== 'pending_payment'))"
        ><div class="digital-ticket">
          <div class="eyebrow">NO.1 SPORTS / MATCH PASS</div>
          <h2>{{ activeBooking.field_name }}</h2>
          <span :class="['status', activeBooking.status]">{{
            labels[activeBooking.status]
          }}</span>
          <div class="ticket-perforation"></div>
          <div class="digital-ticket-body">
            <p v-if="PREVIEW" class="sample-note">
              ตั๋วตัวอย่าง • ใช้เข้าสนามไม่ได้
            </p>
            <img
              v-if="qr"
              class="ticket-qr"
              :src="qr"
              alt="QR ตั๋วสำหรับให้ผู้ดูแลสแกน"
            />
            <div v-else class="qr-wait">
              <Ticket :size="52" />
              <p>
                {{
                  activeBooking.status === "review"
                    ? "ตั๋ว QR จะปรากฏหลังแอดมินตรวจสลิป"
                    : PREVIEW
                      ? "QR จริงจะออกหลังยืนยันการชำระ"
                      : "ยังไม่มีตั๋วเข้าสนาม"
                }}
              </p>
            </div>
            <strong class="ticket-code">{{ activeBooking.code }}</strong>
            <dl>
              <div>
                <dt>ชื่อผู้จอง</dt>
                <dd>{{ activeBooking.name }}</dd>
              </div>
              <div>
                <dt>วันที่</dt>
                <dd>{{ displayDate(activeBooking.booking_date, true) }}</dd>
              </div>
              <div>
                <dt>เวลา</dt>
                <dd>
                  {{ hour(activeBooking.start_hour) }}–{{
                    hour(activeBooking.end_hour)
                  }}
                </dd>
              </div>
              <div>
                <dt>ยอดชำระ</dt>
                <dd>฿{{ money(activeBooking.amount) }}</dd>
              </div>
            </dl>
            <p v-if="activeBooking.review_note" class="sample-note">
              หมายเหตุ: {{ activeBooking.review_note }}
            </p>
            <p class="small muted">
              แสดงตั๋วให้ผู้ดูแลสแกนก่อนเข้าสนาม<br />ตั๋วใช้เช็คอินได้ครั้งเดียว
              กรุณาไม่แชร์ QR
            </p>
            <a
              v-if="qr"
              :href="qr"
              :download="activeBooking.code + '.png'"
              class="button outline"
              ><Download :size="17" /> บันทึก QR</a
            >
          </div>
        </div></template
      >
      <template v-if="modal === 'review' && activeBooking"
        ><div class="eyebrow green">BOOKING DETAILS</div>
        <h2>{{ activeBooking.code }}</h2>
        <span :class="['status', activeBooking.status]">{{
          labels[activeBooking.status]
        }}</span>
        <dl>
          <div>
            <dt>ผู้จอง</dt>
            <dd>{{ activeBooking.name }}</dd>
          </div>
          <div>
            <dt>เบอร์โทร</dt>
            <dd>{{ activeBooking.phone || "ไม่ได้ระบุ" }}</dd>
          </div>
          <div>
            <dt>อีเมล</dt>
            <dd>{{ activeBooking.email || "ไม่ได้ระบุ" }}</dd>
          </div>
          <div>
            <dt>สนาม</dt>
            <dd>{{ activeBooking.field_name }}</dd>
          </div>
          <div>
            <dt>วันเวลา</dt>
            <dd>
              {{ displayDate(activeBooking.booking_date, true) }}<br />{{
                hour(activeBooking.start_hour)
              }}–{{ hour(activeBooking.end_hour) }}
            </dd>
          </div>
          <div>
            <dt>ยอดชำระ</dt>
            <dd>฿{{ money(activeBooking.amount) }}</dd>
          </div>
        </dl>
        <template
          v-if="activeBooking.has_slip || activeBooking.status === 'review'"
          ><div v-if="PREVIEW" class="sample-note">
            พื้นที่แสดงสลิปจริงสำหรับแอดมิน
          </div>
          <a
            v-else
            :href="'api/index.php?action=slip_image&code=' + activeBooking.code"
            target="_blank"
            rel="noopener"
            ><img
              class="slip-image"
              :src="
                'api/index.php?action=slip_image&code=' + activeBooking.code
              "
              alt="สลิปโอนเงินของผู้จอง" /></a></template
        ><template v-if="activeBooking.status === 'review'"
          ><p class="small muted">
            ตรวจยอดเข้า ชื่อผู้รับ จำนวนเงิน
            และวันเวลากับบัญชีธนาคารจริงก่อนยืนยัน
          </p>
          <label
            >หมายเหตุ / เหตุผลที่ไม่ผ่าน<textarea
              v-model="reviewNote"
              maxlength="500"
              rows="2"
            ></textarea>
          </label>
          <div class="action-row">
            <button
              class="button outline danger"
              :disabled="busy || PREVIEW"
              @click="action('reject')"
            >
              ไม่ผ่าน</button
            ><button
              class="button dark"
              :disabled="busy || PREVIEW"
              @click="action('approve')"
            >
              <Check :size="17" /> ยืนยันเงินเข้า
            </button>
          </div></template
        ><button
          v-if="activeBooking.status === 'confirmed'"
          class="button lime full-width"
          :disabled="busy || PREVIEW"
          @click="action('checkin')"
        >
          <CheckCircle2 :size="18" /> ยืนยันเช็คอิน</button
        ><button
          v-if="activeBooking.status === 'checked_in'"
          class="button dark full-width"
          :disabled="busy || PREVIEW"
          @click="action('complete')"
        >
          ยืนยันหมดเวลา
        </button>
        <p v-if="activeBooking.review_note" class="sample-note">
          {{ activeBooking.review_note }}
        </p></template
      >
      <template v-if="modal === 'scanner'"
        ><div class="eyebrow green">READY FOR KICK-OFF</div>
        <h2>สแกนตั๋วเช็คอิน</h2>
        <video ref="video" class="scanner-video" playsinline muted></video
        ><button class="button outline full-width" @click="startScanner">
          <Camera :size="18" /> เปิดกล้องสแกน QR</button
        ><label class="upload-box"
          ><Camera :size="20" /> ถ่ายรูป QR จากมือถือ<input
            type="file"
            accept="image/*"
            capture="environment"
            @change="scanImage"
        /></label>
        <p v-if="scanError" class="alert">{{ scanError }}</p>
        <form @submit.prevent="lookup">
          <label
            >หรือกรอกรหัสตั๋ว<input
              v-model="scanInput"
              placeholder="N1-…"
              maxlength="100"
              required /></label
          ><button class="button dark full-width" :disabled="busy">
            ค้นหาตั๋ว <Search :size="17" />
          </button>
        </form>
        <p class="small muted">
          ระบบแสดงรายละเอียดให้ตรวจสอบก่อนกดยืนยันเช็คอิน
        </p></template
      >
      <template v-if="modal === 'field'"
        ><h2>{{ fieldDraft.id ? "แก้ไขสนาม" : "เพิ่มสนาม" }}</h2>
        <form @submit.prevent="saveField">
          <label
            >ชื่อสนาม<input
              v-model="fieldDraft.name"
              required
              maxlength="100" /></label
          ><label
            >รายละเอียด<textarea
              v-model="fieldDraft.description"
              rows="3"
              maxlength="2000"
            ></textarea></label
          ><label
            >ราคา / ชั่วโมง (บาท)<input
              type="number"
              v-model.number="fieldDraft.price"
              min="1"
              max="100000"
              step="0.01"
              required /></label
          ><label
            >ลิงก์รูปสนาม HTTPS<input
              v-model="fieldDraft.image_url"
              maxlength="500" /></label
          ><label v-if="fieldDraft.id" class="upload-box"
            ><Upload :size="22" /> อัปโหลดรูปสนาม<input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="uploadField"
              :disabled="busy || PREVIEW" /></label
          ><label class="checkbox"
            ><input type="checkbox" v-model="fieldDraft.active" />
            เปิดให้จองสนามนี้</label
          ><button class="button dark full-width" :disabled="busy || PREVIEW">
            บันทึกสนาม
          </button>
        </form></template
      >
      <p v-if="error" class="alert" role="alert">{{ error }}</p>
    </div>
  </dialog>
</template>
