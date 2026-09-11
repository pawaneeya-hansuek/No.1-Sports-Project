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
  MapPin,
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
  finalTotal,
  loyalty,
  loyaltyPointsAvailable,
  loyaltyDiscount,
  useLoyaltyPoints,
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
  mapUrl,
  enableBookingNotifications,
  labels,
  locale,
  t,
} from "./state";
const dialog = ref(null);
const statusText = (status) => {
  const english = {
    pending_payment: "Pending payment",
    review: "Under review",
    confirmed: "Confirmed",
    checked_in: "Playing",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Payment expired",
    rejected: "Slip rejected",
  };
  return locale.value === "th" ? labels[status] : english[status] || status;
};
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
    :aria-label="t('รายละเอียดและดำเนินการ', 'Details and actions')"
    @cancel.prevent="close"
  >
    <div :key="modal" class="modal-inner">
      <button class="modal-close icon-button" @click="close" :aria-label="t('ปิด', 'Close')">
        <X :size="21" />
      </button>
      <template v-if="modal === 'auth'"
        ><div class="eyebrow green">WELCOME TO NO.1 SPORTS</div>
        <h2>
          {{
            authMode === "login"
              ? t("ยินดีต้อนรับกลับสู่สนาม", "Welcome back to the pitch")
              : t("พร้อมสำหรับเกมต่อไป?", "Ready for your next game?")
          }}
        </h2>
        <p class="muted">
          {{
            authMode === "login"
              ? t("เข้าสู่ระบบเพื่อจองสนามและดูตั๋วของคุณ", "Log in to book a field and view your tickets")
              : t("สมัครด้วยอีเมลหรือเบอร์โทร พร้อมตั้งรหัสผ่าน", "Sign up with your email or phone and set a password")
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
            {{ t("เข้าสู่ระบบ", "Log in") }}</button
          ><button
            :class="{ selected: authMode === 'register' }"
            @click="
              authMode = 'register';
              error = '';
            "
          >
            {{ t("สมัครสมาชิก", "Sign up") }}
          </button>
        </div>
        <p v-if="PREVIEW" class="sample-note">
          {{ t("ตัวอย่างนี้ไม่รับข้อมูลส่วนบุคคลหรือสร้างบัญชีจริง", "This demo does not collect personal data or create real accounts") }}
        </p>
        <form :key="authMode" class="auth-form" @submit.prevent="authenticate">
          <template v-if="authMode === 'register'"
            ><label
              >{{ t("ชื่อผู้จอง", "Booker name") }}<input
                v-model="auth.name"
                autocomplete="name"
                required
                maxlength="120"
                :disabled="PREVIEW" /></label
            ><label
              >{{ t("อีเมล", "Email") }}<input
                type="email"
                v-model="auth.email"
                autocomplete="email"
                maxlength="190"
                :disabled="PREVIEW" /></label
            ><label
              >{{ t("เบอร์โทรศัพท์", "Phone") }}<input
                type="tel"
                v-model="auth.phone"
                autocomplete="tel"
                pattern="0[0-9]{8,9}"
                maxlength="10"
                :disabled="PREVIEW"
            /></label>
            <p class="small muted">
              {{ t("กรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่อง ข้อมูลนี้ยังไม่ได้ยืนยันด้วย OTP", "Enter at least an email or phone number. This is not verified with OTP.") }}
            </p></template
          ><label v-else
            >{{ t("อีเมลหรือเบอร์โทร", "Email or phone") }}<input
              v-model="auth.identity"
              autocomplete="username"
              required
              :disabled="PREVIEW" /></label
          ><label
            >{{ t("รหัสผ่าน", "Password") }}<input
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
            {{ t("ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร ข้อมูลติดต่อใช้จัดการการจองและให้ผู้ดูแลสนามติดต่อคุณ", "Use at least 12 characters. Contact details help manage your booking and let staff reach you.") }}
          </p>
          <button class="button dark full-width" :disabled="busy || PREVIEW">
            {{
              busy
                ? t("กำลังดำเนินการ…", "Working...")
                : authMode === "login"
                  ? t("เข้าสู่ระบบ", "Log in")
                  : t("สร้างบัญชี", "Create account")
            }}
            <ArrowRight :size="18" />
          </button></form
      ></template>
      <template v-if="modal === 'confirm'"
        ><div class="eyebrow green">ONE STEP CLOSER TO THE GAME</div>
        <h2>{{ t("ยืนยันการจองสนาม", "Confirm booking") }}</h2>
        <h3>{{ chosenField?.name }}</h3>
        <p>
          {{ displayDate(selectedDate) }}<br />{{ hour(selectedHour) }}–{{
            hour(selectedHour + duration)
          }}
          · {{ duration }} {{ t("ชั่วโมง", "hour(s)") }}
        </p>
        <div class="total-row">
          <span>{{ t("ยอดโอน", "Amount") }}</span><strong>฿{{ money(finalTotal) }}</strong>
        </div>
        <label v-if="loyalty.balance > 0" class="loyalty-choice">
          <input v-model="useLoyaltyPoints" type="checkbox" />
          <span><b>{{ t("ใช้แต้มสะสมเป็นส่วนลด", "Use loyalty points") }}</b><small>{{ loyalty.balance }} {{ t("แต้มคงเหลือ · ใช้ได้สูงสุด", "points available · up to") }} {{ loyaltyPointsAvailable }} {{ t("แต้ม", "points") }}</small></span>
          <strong>-฿{{ money(loyaltyDiscount) }}</strong>
        </label>
        <div class="sample-note">
          {{ t("ระบบกันเวลาไว้ 15 นาทีเพื่อโอนเงินและแนบสลิป หากไม่แนบสลิปทันเวลา ระบบจะคืนช่วงเวลาให้ผู้จองอื่น", "Your slot is held for 15 minutes for payment and slip upload. If no slip is uploaded, it will be released to others.") }}
        </div>
        <button class="button lime full-width" :disabled="busy" @click="book">
          {{ t("ยืนยันและไปชำระเงิน", "Confirm and pay") }} <ArrowRight :size="18" /></button
      ></template>
      <template v-if="modal === 'payment' && activeBooking?.status === 'pending_payment'"
        ><div class="eyebrow green">PAYMENT</div>
        <h2>{{ t("ชำระเงินเพื่อยืนยันการจอง", "Pay to confirm your booking") }}</h2>
        <p>
          {{ activeBooking.field_name }} ·
          {{ displayDate(activeBooking.booking_date, true) }} ·
          {{ hour(activeBooking.start_hour) }}–{{
            hour(activeBooking.end_hour)
          }}
        </p>
        <p class="status pending_payment">
          {{ t("แนบสลิปก่อน", "Upload slip by") }} {{ activeBooking.expires_at?.slice(11, 16) }}
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
            :aria-label="t('คัดลอกบัญชี', 'Copy account number')"
          >
            <Copy :size="19" />
          </button>
        </div>
        <img
          v-if="settings.payment_qr"
          class="payment-qr"
          :src="settings.payment_qr"
          :alt="t('QR สำหรับโอนเงินเข้าบัญชีสนาม', 'QR for field payment')"
        />
        <p v-else class="sample-note">
          {{ t("ยังไม่มี QR รับเงิน กรุณาโอนผ่านเลขบัญชีด้านบน", "No payment QR is available. Please use the account number above.") }}
        </p>
        <div class="total-row">
          <span>{{ t("ยอดที่ต้องโอน", "Amount to transfer") }}</span
          ><strong>฿{{ money(activeBooking.amount) }}</strong>
        </div>
        <div v-if="activeBooking.loyalty_points_used || activeBooking.loyalty_points_earned" class="loyalty-payment-box">
          <div><span>{{ t("แต้มที่ใช้", "Points used") }}</span><b>{{ activeBooking.loyalty_points_used || 0 }}</b></div>
          <div><span>{{ t("แต้มที่จะได้รับหลังใช้สนาม", "Points earned after playing") }}</span><b>+{{ activeBooking.loyalty_points_earned || Math.floor(Number(activeBooking.amount || 0) / Number(loyalty.unit_amount || 100)) * Number(loyalty.points_per_unit || 5) }}</b></div>
          <small>{{ t("แต้มจะเข้าบัญชีเมื่อชำระเงินครบและใช้สนามเสร็จ", "Points are credited after payment is confirmed and the session is completed") }}</small>
        </div>
        <p class="small muted">
          {{ t("ตรวจชื่อผู้รับและยอดเงินในแอปธนาคารก่อนโอน แอดมินจะตรวจยอดเข้าบัญชีก่อนออกตั๋ว", "Check the recipient and amount in your banking app. Staff will verify the payment before issuing a ticket.") }}
        </p>
        <form @submit.prevent="sendSlip">
          <label class="upload-box"
            ><Upload :size="25" />{{ slip ? slip.name : t("แนบสลิปโอนเงิน", "Upload payment slip")
            }}<input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              @change="slip = $event.target.files[0]"
          /></label>
          <p class="small muted">{{ t("JPG, PNG หรือ WebP ไม่เกิน 5 MB", "JPG, PNG, or WebP up to 5 MB") }}</p>
          <button
            class="button dark full-width"
            :disabled="
              busy || !slip || activeBooking.status !== 'pending_payment'
            "
          >
            {{ t("ส่งสลิปให้ผู้ดูแลตรวจ", "Submit slip for review") }} <ArrowRight :size="18" />
          </button>
        </form>
        <p v-if="activeBooking.status !== 'pending_payment'" class="alert">
          {{ statusText(activeBooking.status) }} {{ t("หากโอนแล้วให้ติดต่อสนาม", "If you have paid, contact the field") }}
        </p>
        <button class="text-button danger" @click="show('cancel')">
          {{ t("ยังไม่ได้โอนเงิน ต้องการยกเลิก", "I have not paid. Cancel booking") }}
        </button></template
      >
      <template v-if="modal === 'cancel'"
        ><h2>{{ t("ยกเลิกการจองนี้?", "Cancel this booking?") }}</h2>
        <p>
          {{ t("ช่วงเวลาจะถูกคืนให้ผู้อื่นจอง หากโอนเงินแล้วให้กลับไปแนบสลิปหรือติดต่อสนาม", "The slot will be released to others. If you have paid, upload the slip or contact the field.") }}
        </p>
        <div class="action-row">
          <button class="button outline" @click="show('payment')">
            {{ t("กลับไปชำระ", "Back to payment") }}</button
          ><button
            class="button danger-fill"
            :disabled="busy"
            @click="cancelBooking"
          >
            {{ t("ยืนยันยกเลิก", "Confirm cancellation") }}
          </button>
        </div></template
      >
      <template v-if="activeBooking && (modal === 'ticket' || (modal === 'payment' && activeBooking.status !== 'pending_payment'))"
        ><div class="digital-ticket">
          <div class="eyebrow">NO.1 SPORTS / MATCH PASS</div>
          <h2>{{ activeBooking.field_name }}</h2>
          <span :class="['status', activeBooking.status]">{{
          statusText(activeBooking.status)
          }}</span>
          <div class="ticket-perforation"></div>
          <div class="digital-ticket-body">
            <p v-if="PREVIEW" class="sample-note">
              {{ t("ตั๋วตัวอย่าง • ใช้เข้าสนามไม่ได้", "Demo ticket • not valid for entry") }}
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
                    ? t("ตั๋ว QR จะปรากฏหลังแอดมินตรวจสลิป", "Your QR ticket will appear after staff reviews the slip")
                    : PREVIEW
                      ? t("QR จริงจะออกหลังยืนยันการชำระ", "A real QR will be issued after payment confirmation")
                      : t("ยังไม่มีตั๋วเข้าสนาม", "No entry ticket yet")
                }}
              </p>
            </div>
            <strong class="ticket-code">{{ activeBooking.code }}</strong>
            <dl>
              <div>
                <dt>{{ t("ชื่อผู้จอง", "Booker") }}</dt>
                <dd>{{ activeBooking.name }}</dd>
              </div>
              <div>
                <dt>{{ t("วันที่", "Date") }}</dt>
                <dd>{{ displayDate(activeBooking.booking_date, true) }}</dd>
              </div>
              <div>
                <dt>{{ t("เวลา", "Time") }}</dt>
                <dd>
                  {{ hour(activeBooking.start_hour) }}–{{
                    hour(activeBooking.end_hour)
                  }}
                </dd>
              </div>
              <div>
                <dt>{{ t("ยอดชำระ", "Amount") }}</dt>
                <dd>฿{{ money(activeBooking.amount) }}</dd>
              </div>
            </dl>
            <p v-if="activeBooking.review_note" class="sample-note">
              {{ t("หมายเหตุ", "Note") }}: {{ activeBooking.review_note }}
            </p>
            <p class="small muted">
              {{ t("แสดงตั๋วให้ผู้ดูแลสแกนก่อนเข้าสนาม", "Show this ticket to staff before entry") }}<br />{{ t("ตั๋วใช้เช็คอินได้ครั้งเดียว กรุณาไม่แชร์ QR", "This ticket can be checked in once. Do not share the QR.") }}
            </p>
            <a v-if="mapUrl()" :href="mapUrl()" target="_blank" rel="noopener" class="button outline full-width">
              <MapPin :size="17" /> {{ t("เปิดแผนที่ไปสนาม", "Open directions to the field") }}
            </a>
            <button v-if="typeof Notification === 'undefined' || Notification.permission !== 'granted'" type="button" class="button outline full-width" @click="enableBookingNotifications">
              {{ t("เปิดแจ้งเตือนก่อนถึงเวลาเล่น", "Enable pre-game reminder") }}
            </button>
            <a
              v-if="qr"
              :href="qr"
              :download="activeBooking.code + '.png'"
              class="button outline"
              ><Download :size="17" /> {{ t("บันทึก QR", "Save QR") }}</a
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
          <div v-if="activeBooking.loyalty_points_used">
            <dt>แต้มที่ใช้ / คืนได้</dt>
            <dd>{{ activeBooking.loyalty_points_used }} แต้ม</dd>
          </div>
          <div v-if="activeBooking.loyalty_points_earned">
            <dt>แต้มที่ได้รับ</dt>
            <dd>{{ activeBooking.loyalty_points_earned }} แต้ม</dd>
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
        <button
          v-if="['confirmed', 'checked_in', 'completed'].includes(activeBooking.status)"
          class="button outline danger full-width"
          :disabled="busy || PREVIEW"
          @click="action('refund')"
        >ยืนยันคืนเงินและคืนแต้ม</button>
        <p v-if="activeBooking.review_note" class="sample-note">
          {{ activeBooking.review_note }}
        </p></template
      >
      <template v-if="modal === 'scanner'"
        ><div class="eyebrow green">READY FOR KICK-OFF</div>
        <h2>{{ t("สแกนตั๋วเช็คอิน", "Scan check-in ticket") }}</h2>
        <video ref="video" class="scanner-video" playsinline muted></video
        ><button class="button outline full-width" @click="startScanner">
          <Camera :size="18" /> {{ t("เปิดกล้องสแกน QR", "Open QR scanner") }}</button
        ><label class="upload-box"
          ><Camera :size="20" /> {{ t("ถ่ายรูป QR จากมือถือ", "Take a QR photo") }}<input
            type="file"
            accept="image/*"
            capture="environment"
            @change="scanImage"
        /></label>
        <p v-if="scanError" class="alert">{{ scanError }}</p>
        <form @submit.prevent="lookup">
          <label
            >{{ t("หรือกรอกรหัสตั๋ว", "Or enter ticket code") }}<input
              v-model="scanInput"
              placeholder="N1-…"
              maxlength="100"
              required /></label
          ><button class="button dark full-width" :disabled="busy">
            {{ t("ค้นหาตั๋ว", "Find ticket") }} <Search :size="17" />
          </button>
        </form>
        <p class="small muted">
          {{ t("ระบบแสดงรายละเอียดให้ตรวจสอบก่อนกดยืนยันเช็คอิน", "Review the details before confirming check-in") }}
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
