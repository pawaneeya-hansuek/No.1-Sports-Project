<script setup>
import { reveal as vReveal } from "./motion";
import {
  ShieldCheck,
  ScanLine,
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  RefreshCw,
  Trash2,
} from "lucide-vue-next";
import {
  PREVIEW,
  canAdmin,
  today,
  stats,
  adminRows,
  adminNewBookingCodes,
  adminLoading,
  adminError,
  adminSynced,
  adminTotal,
  adminPage,
  adminFilter,
  adminSearch,
  adminTab,
  allFields,
  settings,
  settingsDraft,
  logs,
  adminLoyalty,
  busy,
  error,
  scanInput,
  scanError,
  show,
  refreshAdmin,
  refreshAdminSection,
  enableAdminNotifications,
  adminSectionLoading,
  adminSectionError,
  searchAdmin,
  settingsDirty,
  resetSettingsDraft,
  openReview,
  editField,
  saveSettings,
  uploadQR,
  money,
  hour,
  displayDate,
  labels,
  deleteAuditLog,
  deleteBookingHistory,
  locale,
  t,
} from "./state";
const statusText = (status) => {
  const english = { pending_payment: "Pending payment", review: "Under review", confirmed: "Confirmed", checked_in: "Playing", completed: "Completed", cancelled: "Cancelled", expired: "Expired", rejected: "Rejected" };
  return locale.value === "th" ? labels[status] : english[status] || status;
};
</script>
<template>
  <main class="page-container admin-page">
    <div v-if="!canAdmin" class="empty-state">
      <ShieldCheck :size="40" />
      <h1>{{ t("สำหรับผู้ดูแลสนาม", "For field staff") }}</h1>
      <p>{{ t("เข้าสู่ระบบด้วยบัญชีแอดมินเพื่อจัดการสนาม", "Log in with an admin account to manage the field") }}</p>
      <button class="button dark" @click="show('auth')">{{ t("เข้าสู่ระบบ", "Log in") }}</button>
    </div>
    <template v-else
      ><div v-reveal class="page-title">
        <div>
          <div class="eyebrow green">NO.1 SPORTS / CONTROL ROOM</div>
          <h1>{{ t("ภาพรวมสนาม", "Field overview") }}</h1>
          <p>
            {{ displayDate(today) }} ·
            {{ PREVIEW ? t("ข้อมูลตัวอย่าง · ยังไม่บันทึกข้อมูลจริง", "Demo data · changes are not saved") : t("จัดการการจอง สนาม และการรับชำระเงิน", "Manage bookings, fields, and payments") }}
          </p>
        </div>
        <button
          class="button dark"
          @click="
            scanInput = '';
            scanError = '';
            show('scanner');
          "
        >
          <ScanLine :size="19" /> {{ t("สแกนเช็คอิน", "Scan check-in") }}
        </button>
      </div>
      <div class="admin-sync" role="status">
        <span>{{ PREVIEW ? t('โหมดตัวอย่าง', 'Demo mode') : adminError ? t('อัปเดตไม่สำเร็จ · ข้อมูลอาจไม่ใช่ล่าสุด', 'Update failed · data may be stale') : adminLoading ? t('กำลังอัปเดตข้อมูล…', 'Updating data...') : adminSynced ? t('อัปเดตล่าสุด ', 'Last updated ') + adminSynced : t('กำลังเตรียมข้อมูล', 'Preparing data') }}</span>
        <button class="button outline compact" :disabled="adminLoading || adminSectionLoading" @click="refreshAdmin(); refreshAdminSection()"><RefreshCw :size="15" /> {{ t("รีเฟรชข้อมูล", "Refresh data") }}</button>
      </div>
      <div v-if="adminNewBookingCodes.length" class="new-booking-alert" role="alert">
        <strong>{{ t("มีคนจองใหม่", "New booking received") }} {{ adminNewBookingCodes.length }} {{ t("รายการ", "item(s)") }}</strong>
        <button class="button danger-fill compact" @click="adminTab = 'bookings'; adminFilter = ''; searchAdmin('')">{{ t("ดูรายการใหม่", "View new bookings") }} <ArrowUpRight :size="15" /></button>
      </div>
      <div class="notification-setting">
        <button class="button outline compact" type="button" @click="enableAdminNotifications">{{ t("เปิดแจ้งเตือนการจอง", "Enable booking alerts") }}</button>
      </div>
      <p v-if="adminError" class="alert" role="alert">{{ adminError }} {{ t("กรุณากดรีเฟรชเพื่อลองอีกครั้ง", "Please refresh and try again") }}</p>
      <div v-reveal="70" class="stats-grid" :key="locale">
        <div>
          <span>{{ locale === "th" ? "การจองทั้งหมด" : "Total bookings" }}</span
          ><strong>{{ stats.total }} <small>{{ t("รายการ", "items") }}</small></strong>
        </div>
        <div>
          <span>{{ locale === "th" ? "รอตรวจสลิปทั้งหมด" : "Slips to review" }}</span
          ><strong>{{ stats.review }} <small>{{ t("รายการ", "items") }}</small></strong>
        </div>
        <div>
          <span>{{ locale === "th" ? "กำลังใช้สนาม" : "Currently playing" }}</span
          ><strong>{{ stats.playing }} <small>{{ t("รายการ", "items") }}</small></strong>
        </div>
        <div class="revenue">
          <span>{{ locale === "th" ? "รายได้ยืนยันแล้วทั้งหมด" : "Total confirmed revenue" }}</span
          ><strong>฿{{ money(stats.revenue) }}</strong>
        </div>
      </div>
      <div class="admin-shortcuts" :aria-label="t('งานที่ใช้บ่อย', 'Common tasks')">
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('review')">{{ t("รอตรวจสลิป", "Review slips") }} <b>{{ stats.review }}</b></button>
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('confirmed')">{{ t("รอเช็คอิน", "Awaiting check-in") }}</button>
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('checked_in')">{{ t("กำลังใช้สนาม", "Currently playing") }} <b>{{ stats.playing }}</b></button>
      </div>
      <div class="admin-tabs" :aria-label="t('จัดการสนาม', 'Field management')">
        <button
          v-for="tab in [
            ['bookings', t('รายการจอง', 'Bookings')],
            ['fields', t('สนามและราคา', 'Fields and pricing')],
            ['settings', t('ตั้งค่าเว็บไซต์', 'Website settings')],
            ['loyalty', t('ระบบสะสมแต้ม', 'Loyalty program')],
            ['audit', t('ประวัติการดำเนินการ', 'Activity log')],
          ]"
          :key="tab[0]"
          :class="{ selected: adminTab === tab[0] }"
          :aria-pressed="adminTab === tab[0]"
          @click="adminTab = tab[0]"
        >
          {{ tab[1] }}
        </button>
      </div>
      <p v-if="adminSectionError" class="alert" role="alert">{{ adminSectionError }} <button class="button outline compact" :disabled="adminSectionLoading" @click="refreshAdminSection()">{{ t("ลองอีกครั้ง", "Try again") }}</button></p>
      <p v-if="adminSectionLoading" class="muted" role="status">{{ t("กำลังโหลดข้อมูล…", "Loading data...") }}</p>
      <section v-if="adminTab === 'bookings'" class="panel">
        <div class="admin-section-heading"><div><h2>{{ t("รายการจอง", "Bookings") }}</h2><p>{{ t("ค้นหาและตรวจสอบการจองจากทุกวัน", "Search and review bookings from all dates") }}</p></div><span class="admin-count">{{ adminTotal }} {{ t("รายการ", "items") }}</span></div>
        <form
          class="table-toolbar"
          @submit.prevent="searchAdmin()"
        >
          <div class="search-box">
            <Search :size="18" /><input
              v-model="adminSearch"
              maxlength="120"
              type="search"
              :placeholder="t('ค้นหาชื่อ เบอร์โทร หรือรหัสจอง', 'Search name, phone, or booking code')"
              :aria-label="t('ค้นหาการจอง', 'Search bookings')"
            />
          </div>
          <select
            v-model="adminFilter"
            @change="searchAdmin()"
            :aria-label="t('กรองสถานะ', 'Filter status')"
          >
            <option value="">{{ t("ทุกสถานะ", "All statuses") }}</option>
            <option v-for="(l, k) in labels" :key="k" :value="k">{{ statusText(k) }}</option></select
          ><button class="button outline" type="submit" :disabled="adminLoading">{{ t("ค้นหา", "Search") }}</button>
          <button v-if="adminSearch || adminFilter" class="button outline" type="button" @click="adminSearch = ''; searchAdmin('')">{{ t("ล้างตัวกรอง", "Clear filters") }}</button>
        </form>
        <div class="table-wrap" :aria-busy="adminLoading">
          <table class="admin-bookings-table">
            <thead>
              <tr>
                <th>{{ t("ผู้จอง / รหัส", "Booker / code") }}</th>
                <th>{{ t("สนาม / วันเวลา", "Field / time") }}</th>
                <th>{{ t("ยอดชำระ", "Amount") }}</th>
                <th>{{ t("สถานะ", "Status") }}</th>
                <th>{{ t("จัดการ", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in adminRows" :key="b.code" :class="{ 'new-booking-row': adminNewBookingCodes.includes(b.code) }">
                <td :data-label="t('ผู้จอง / รหัส', 'Booker / code')">
                  <b>{{ b.name }}</b
                  ><small>{{ b.phone || b.email || t("ไม่มีเบอร์โทร", "No phone") }}</small
                  ><small>{{ b.code }}</small>
                </td>
                <td :data-label="t('สนาม / วันเวลา', 'Field / time')">
                  <b>{{ b.field_name }}</b
                  ><small
                    >{{ displayDate(b.booking_date, true) }} ·
                    {{ hour(b.start_hour) }}–{{ hour(b.end_hour) }}</small
                  >
                </td>
                <td :data-label="t('ยอดชำระ', 'Amount')">
                  <b>฿{{ money(b.amount) }}</b>
                </td>
                <td :data-label="t('สถานะ', 'Status')">
                  <span :class="['status', b.status]">{{
                    statusText(b.status)
                  }}</span>
                </td>
                <td :data-label="t('จัดการ', 'Actions')">
                  <button :class="['button compact', adminNewBookingCodes.includes(b.code) ? 'danger-fill new-booking-button' : 'outline']" @click="openReview(b)">
                    {{ b.status === 'review' ? t('ตรวจสลิป', 'Review slip') : b.status === 'confirmed' ? t('เช็คอิน / ดูตั๋ว', 'Check in / ticket') : t('ดูรายการ', 'View booking') }} <ArrowUpRight :size="15" />
                  </button>
                  <button
                    v-if="['completed', 'cancelled', 'expired', 'rejected'].includes(b.status)"
                    class="button danger compact"
                    type="button"
                    :disabled="busy"
                    @click="deleteBookingHistory(b)"
                  >
                    {{ t("ลบประวัติ", "Delete history") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!adminRows.length">
                <td colspan="5" class="center muted admin-empty">{{ adminLoading ? t('กำลังโหลดรายการ…', 'Loading bookings...') : adminError ? t('โหลดรายการไม่สำเร็จ กรุณากดรีเฟรช', 'Could not load bookings. Refresh to try again.') : t('ไม่พบรายการจอง ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง', 'No bookings found. Change your search or clear filters.') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>{{ adminTotal }} {{ t("รายการ", "items") }}</span
          ><button
            class="icon-button"
            :disabled="adminLoading || adminPage <= 1"
            @click="
              adminPage--;
              refreshAdmin();
            "
            :aria-label="t('หน้าก่อน', 'Previous page')"
          >
            <ChevronLeft :size="18" /></button
          ><span>{{ t("หน้า", "Page") }} {{ adminPage }} / {{ Math.max(1, Math.ceil(adminTotal / 50)) }}</span
          ><button
            class="icon-button"
            :disabled="adminLoading || adminPage * 50 >= adminTotal"
            @click="
              adminPage++;
              refreshAdmin();
            "
            :aria-label="t('หน้าถัดไป', 'Next page')"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </section>
      <section v-if="adminTab === 'fields'" class="panel padding">
        <div class="section-head">
          <h2>{{ t("สนามและราคาต่อชั่วโมง", "Fields and hourly pricing") }}</h2>
          <button class="button dark" @click="editField()">
            <Plus :size="18" /> {{ t("เพิ่มสนาม", "Add field") }}
          </button>
        </div>
        <div class="manage-fields">
          <article v-for="f in allFields" :key="f.id">
            <img :src="f.image_url || './field.jpg'" :alt="f.name" />
            <div>
              <h3>{{ f.name }}</h3>
              <p>{{ f.description }}</p>
              <b>฿{{ money(f.price) }} / {{ t("ชั่วโมง", "hour") }}</b
              ><small>{{ Number(f.active) ? t("เปิดจอง", "Available") : t("ปิดจอง", "Closed") }}</small>
            </div>
            <button class="button outline" @click="editField(f)">{{ t("แก้ไข", "Edit") }}</button>
          </article>
        </div>
        <p v-if="!allFields.length && !adminSectionLoading && !adminSectionError" class="muted">
          {{ t("ยังไม่มีสนาม กด “เพิ่มสนาม” เพื่อเริ่มต้น", "No fields yet. Click “Add field” to get started.") }}
        </p>
      </section>
      <section v-if="adminTab === 'settings'" class="panel padding">
        <form class="settings-form" @submit.prevent="saveSettings">
          <div>
            <h2>{{ t("ข้อมูลสนาม", "Field information") }}</h2>
            <label
              >{{ t("ที่อยู่", "Address") }}<textarea
                v-model="settingsDraft.address"
                maxlength="3000"
                rows="3"
              ></textarea></label
            ><label
              >{{ t("ช่องทางติดต่อ", "Contact") }}<input
                v-model="settingsDraft.contact"
                maxlength="120" /></label
            ><label
              >{{ t("อุปกรณ์และสิ่งอำนวยความสะดวก (หนึ่งรายการต่อบรรทัด)", "Equipment and facilities (one item per line)") }}<textarea
                v-model="settingsDraft.facilities"
                maxlength="3000"
                rows="4"
              ></textarea></label
            ><label
              >{{ t("โปรโมชั่น", "Promotion") }}<textarea
                v-model="settingsDraft.promotion"
                maxlength="3000"
                rows="3"
              ></textarea></label
            ><div class="promotion-settings">
              <label
                >{{ t("โค้ดโปรโมชั่น", "Promo code") }}<input
                  v-model.trim="settingsDraft.promotion_code"
                  maxlength="40"
                  :placeholder="t('เช่น No1Sports', 'e.g. No1Sports')"
              /></label>
              <label
                >{{ t("ส่วนลดเปอร์เซ็นต์", "Discount percentage") }}<input
                  v-model.number="settingsDraft.promotion_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  :placeholder="t('0 = ปิดโปรโมชั่น', '0 = disable promotion')"
              /></label>
              <p class="small muted">{{ t("เว้นโค้ดหรือใส่ส่วนลด 0 เพื่อปิดการใช้โปรโมชั่น", "Leave the code blank or set discount to 0 to disable promotion") }}</p>
            </div
            ><div class="promotion-settings loyalty-settings">
              <h3>{{ t("ตั้งค่าระบบสะสมแต้ม", "Loyalty settings") }}</h3>
              <label>{{ t("ยอดชำระต่อหน่วยแต้ม (บาท)", "Paid baht per points unit") }}<input v-model.number="settingsDraft.loyalty_unit_amount" type="number" min="1" step="0.01" /></label>
              <label>{{ t("แต้มที่ได้รับต่อหน่วย", "Points per unit") }}<input v-model.number="settingsDraft.loyalty_points_per_unit" type="number" min="0" step="1" /></label>
              <label>{{ t("เพดานส่วนลดจากแต้ม (%)", "Points discount cap (%)") }}<input v-model.number="settingsDraft.loyalty_discount_cap_percent" type="number" min="0" max="100" step="0.01" /></label>
              <p class="small muted">{{ t("ค่าเริ่มต้น: จ่ายทุก 100 บาท รับ 5 แต้ม และใช้ลดได้ไม่เกิน 10% ของค่าจอง", "Defaults: every 100 baht earns 5 points, capped at 10% of the booking") }}</p>
            </div
            ><label
              >{{ t("คำแนะนำและเงื่อนไขการใช้สนาม", "Rules and field conditions") }}<textarea
                v-model="settingsDraft.rules"
                maxlength="3000"
                rows="4"
              ></textarea></label
            ><label class="checkbox"
              ><input type="checkbox" v-model="settingsDraft.booking_enabled" />
              {{ t("เปิดรับจองสนาม", "Open for booking") }}</label
            ><p v-if="settingsDirty" class="settings-unsaved" role="status">{{ t("มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก", "Unsaved changes") }}</p><button class="button dark" :disabled="busy || PREVIEW || !settingsDirty">
              {{ busy ? t('กำลังบันทึก…', 'Saving...') : t('บันทึกการตั้งค่า', 'Save settings') }}
            </button>
            <button class="button outline" type="button" :disabled="busy || !settingsDirty" @click="resetSettingsDraft">{{ t("คืนค่าที่บันทึกไว้", "Revert saved settings") }}</button>
          </div>
          <div class="bank-panel">
            <h2>{{ t("บัญชีรับเงิน", "Payment account") }}</h2>
            <span class="bank-logo">K</span>
            <h3>{{ settings.bank_name }}</h3>
            <strong>{{ settings.bank_account }}</strong>
            <p>{{ settings.bank_holder }}</p>
            <label class="upload-box"
              ><Upload :size="24" /> {{ t("อัปโหลด QR รับเงินจริงจากธนาคาร", "Upload real bank payment QR") }}<input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="uploadQR"
                :disabled="busy || PREVIEW"
            /></label>
            <p class="small muted">
              {{ t("JPG, PNG หรือ WebP ไม่เกิน 5 MB", "JPG, PNG, or WebP up to 5 MB") }}<br />{{ t("ตรวจชื่อผู้รับบน QR ให้ตรงกับบัญชีก่อนเปิดรับจอง", "Check the QR recipient name before opening bookings") }}
            </p>
            <img
              v-if="settings.payment_qr"
              class="payment-qr"
              :src="settings.payment_qr"
              alt="QR รับเงินของสนาม"
            />
            <div class="sample-note">
              {{ t("การยืนยันสลิปทำโดยแอดมิน หลังตรวจยอดเข้าบัญชีจริง ระบบไม่ได้เชื่อมตรวจยอดธนาคารอัตโนมัติ", "Slips are verified by staff after checking the actual payment. The system does not connect to the bank automatically.") }}
            </div>
          </div>
        </form>
      </section>
      <section v-if="adminTab === 'loyalty'" class="panel padding">
        <div class="admin-section-heading"><div><h2>{{ t("ภาพรวมแต้มลูกค้า", "Customer loyalty overview") }}</h2><p>{{ t("ตรวจสอบแต้มที่ได้รับ แต้มที่ใช้ และยอดคงเหลือของลูกค้า", "Review earned, redeemed, and current customer points") }}</p></div></div>
        <div class="stats-grid loyalty-stats"><div><span>{{ t("แต้มที่แจกแล้ว", "Points earned") }}</span><strong>{{ adminLoyalty.summary.earned }}</strong></div><div><span>{{ t("แต้มที่ใช้เป็นส่วนลด", "Points redeemed") }}</span><strong>{{ adminLoyalty.summary.used }}</strong></div></div>
        <div class="table-wrap"><table><thead><tr><th>{{ t("ลูกค้า", "Customer") }}</th><th>{{ t("แต้มคงเหลือ", "Balance") }}</th><th>{{ t("ใช้ไปแล้ว", "Redeemed") }}</th></tr></thead><tbody><tr v-for="customer in adminLoyalty.customers" :key="customer.id"><td><b>{{ customer.name }}</b><small>{{ customer.phone || customer.email || '' }}</small></td><td><b>{{ customer.balance }}</b></td><td>{{ customer.used }}</td></tr><tr v-if="!adminLoyalty.customers.length"><td colspan="3" class="center muted">{{ t("ยังไม่มีข้อมูลแต้ม", "No loyalty data yet") }}</td></tr></tbody></table></div>
      </section>
      <section v-if="adminTab === 'audit'" class="panel padding">
        <h2>{{ t("ประวัติการดำเนินการล่าสุด", "Recent activity") }}</h2>
        <p v-if="!logs.length && !adminSectionLoading && !adminSectionError" class="muted">
          {{ t("ยังไม่มีประวัติ", "No activity yet") }}{{ PREVIEW ? t("ในโหมดตัวอย่าง", " in demo mode") : "" }}
        </p>
        <div class="table-wrap">
          <table v-if="logs.length">
            <thead>
              <tr>
                <th>{{ t("เวลา", "Time") }}</th>
                <th>{{ t("ผู้ดำเนินการ", "Actor") }}</th>
                <th>{{ t("การดำเนินการ", "Action") }}</th>
                <th>{{ t("รายละเอียด", "Details") }}</th>
                <th>{{ t("จัดการ", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td>{{ log.created_at }}</td>
                <td>{{ log.name }}</td>
                <td>{{ log.action }}</td>
                <td>{{ log.details }}</td>
                <td>
                  <button
                    class="icon-button"
                    type="button"
                    :disabled="busy || PREVIEW"
                    :aria-label="t('ลบประวัติรายการนี้', 'Delete this activity')"
                    :title="t('ลบประวัติรายการนี้', 'Delete this activity')"
                    @click="deleteAuditLog(log)"
                  >
                    <Trash2 :size="17" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <p v-if="error" role="alert" class="alert">{{ error }}</p></template
    >
  </main>
</template>
