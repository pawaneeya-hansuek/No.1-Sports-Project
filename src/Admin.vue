<script setup>
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
  busy,
  error,
  scanInput,
  scanError,
  show,
  refreshAdmin,
  refreshAdminSection,
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
} from "./state";
</script>
<template>
  <main class="page-container admin-page">
    <div v-if="!canAdmin" class="empty-state">
      <ShieldCheck :size="40" />
      <h1>สำหรับผู้ดูแลสนาม</h1>
      <p>เข้าสู่ระบบด้วยบัญชีแอดมินเพื่อจัดการสนาม</p>
      <button class="button dark" @click="show('auth')">เข้าสู่ระบบ</button>
    </div>
    <template v-else
      ><div class="page-title">
        <div>
          <div class="eyebrow green">NO.1 SPORTS / CONTROL ROOM</div>
          <h1>ภาพรวมสนาม</h1>
          <p>
            {{ displayDate(today) }} ·
            {{ PREVIEW ? "ข้อมูลตัวอย่าง · ยังไม่บันทึกข้อมูลจริง" : "จัดการการจอง สนาม และการรับชำระเงิน" }}
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
          <ScanLine :size="19" /> สแกนเช็คอิน
        </button>
      </div>
      <div class="admin-sync" role="status">
        <span>{{ PREVIEW ? 'โหมดตัวอย่าง' : adminError ? 'อัปเดตไม่สำเร็จ · ข้อมูลอาจไม่ใช่ล่าสุด' : adminLoading ? 'กำลังอัปเดตข้อมูล…' : adminSynced ? 'อัปเดตล่าสุด ' + adminSynced : 'กำลังเตรียมข้อมูล' }}</span>
        <button class="button outline compact" :disabled="adminLoading || adminSectionLoading" @click="refreshAdmin(); refreshAdminSection()"><RefreshCw :size="15" /> รีเฟรชข้อมูล</button>
      </div>
      <p v-if="adminError" class="alert" role="alert">{{ adminError }} กรุณากดรีเฟรชเพื่อลองอีกครั้ง</p>
      <div class="stats-grid">
        <div>
          <span>การจองทั้งหมด</span
          ><strong>{{ stats.total }} <small>รายการ</small></strong>
        </div>
        <div>
          <span>รอตรวจสลิปทั้งหมด</span
          ><strong>{{ stats.review }} <small>รายการ</small></strong>
        </div>
        <div>
          <span>กำลังใช้สนาม</span
          ><strong>{{ stats.playing }} <small>รายการ</small></strong>
        </div>
        <div class="revenue">
          <span>ยอดยืนยันสะสม</span
          ><strong>฿{{ money(stats.revenue) }}</strong>
        </div>
      </div>
      <div class="admin-shortcuts" aria-label="งานที่ใช้บ่อย">
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('review')">รอตรวจสลิป <b>{{ stats.review }}</b></button>
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('confirmed')">รอเช็คอิน</button>
        <button class="button outline" @click="adminTab = 'bookings'; adminSearch = ''; searchAdmin('checked_in')">กำลังใช้สนาม <b>{{ stats.playing }}</b></button>
      </div>
      <div class="admin-tabs" aria-label="จัดการสนาม">
        <button
          v-for="t in [
            ['bookings', 'รายการจอง'],
            ['fields', 'สนามและราคา'],
            ['settings', 'ตั้งค่าเว็บไซต์'],
            ['audit', 'ประวัติการดำเนินการ'],
          ]"
          :key="t[0]"
          :class="{ selected: adminTab === t[0] }"
          :aria-pressed="adminTab === t[0]"
          @click="adminTab = t[0]"
        >
          {{ t[1] }}
        </button>
      </div>
      <p v-if="adminSectionError" class="alert" role="alert">{{ adminSectionError }} <button class="button outline compact" :disabled="adminSectionLoading" @click="refreshAdminSection()">ลองอีกครั้ง</button></p>
      <p v-if="adminSectionLoading" class="muted" role="status">กำลังโหลดข้อมูล…</p>
      <section v-if="adminTab === 'bookings'" class="panel">
        <div class="admin-section-heading"><div><h2>รายการจอง</h2><p>ค้นหาและตรวจสอบการจองจากทุกวัน</p></div><span class="admin-count">{{ adminTotal }} รายการ</span></div>
        <form
          class="table-toolbar"
          @submit.prevent="searchAdmin()"
        >
          <div class="search-box">
            <Search :size="18" /><input
              v-model="adminSearch"
              maxlength="120"
              type="search"
              placeholder="ค้นหาชื่อ เบอร์โทร หรือรหัสจอง"
              aria-label="ค้นหาการจอง"
            />
          </div>
          <select
            v-model="adminFilter"
            @change="searchAdmin()"
            aria-label="กรองสถานะ"
          >
            <option value="">ทุกสถานะ</option>
            <option v-for="(l, k) in labels" :key="k" :value="k">{{ l }}</option></select
          ><button class="button outline" type="submit" :disabled="adminLoading">ค้นหา</button>
          <button v-if="adminSearch || adminFilter" class="button outline" type="button" @click="adminSearch = ''; searchAdmin('')">ล้างตัวกรอง</button>
        </form>
        <div class="table-wrap" :aria-busy="adminLoading">
          <table class="admin-bookings-table">
            <thead>
              <tr>
                <th>ผู้จอง / รหัส</th>
                <th>สนาม / วันเวลา</th>
                <th>ยอดชำระ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in adminRows" :key="b.code">
                <td data-label="ผู้จอง / รหัส">
                  <b>{{ b.name }}</b
                  ><small>{{ b.phone || b.email || "ไม่มีเบอร์โทร" }}</small
                  ><small>{{ b.code }}</small>
                </td>
                <td data-label="สนาม / วันเวลา">
                  <b>{{ b.field_name }}</b
                  ><small
                    >{{ displayDate(b.booking_date, true) }} ·
                    {{ hour(b.start_hour) }}–{{ hour(b.end_hour) }}</small
                  >
                </td>
                <td data-label="ยอดชำระ">
                  <b>฿{{ money(b.amount) }}</b>
                </td>
                <td data-label="สถานะ">
                  <span :class="['status', b.status]">{{
                    labels[b.status]
                  }}</span>
                </td>
                <td data-label="จัดการ">
                  <button class="button outline compact" @click="openReview(b)">
                    {{ b.status === 'review' ? 'ตรวจสลิป' : b.status === 'confirmed' ? 'เช็คอิน / ดูตั๋ว' : 'ดูรายการ' }} <ArrowUpRight :size="15" />
                  </button>
                  <button
                    v-if="['completed', 'cancelled', 'expired', 'rejected'].includes(b.status)"
                    class="button danger compact"
                    type="button"
                    :disabled="busy"
                    @click="deleteBookingHistory(b)"
                  >
                    ลบประวัติ
                  </button>
                </td>
              </tr>
              <tr v-if="!adminRows.length">
                <td colspan="5" class="center muted admin-empty">{{ adminLoading ? 'กำลังโหลดรายการ…' : adminError ? 'โหลดรายการไม่สำเร็จ กรุณากดรีเฟรช' : 'ไม่พบรายการจอง ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>{{ adminTotal }} รายการ</span
          ><button
            class="icon-button"
            :disabled="adminLoading || adminPage <= 1"
            @click="
              adminPage--;
              refreshAdmin();
            "
            aria-label="หน้าก่อน"
          >
            <ChevronLeft :size="18" /></button
          ><span>หน้า {{ adminPage }} / {{ Math.max(1, Math.ceil(adminTotal / 50)) }}</span
          ><button
            class="icon-button"
            :disabled="adminLoading || adminPage * 50 >= adminTotal"
            @click="
              adminPage++;
              refreshAdmin();
            "
            aria-label="หน้าถัดไป"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </section>
      <section v-if="adminTab === 'fields'" class="panel padding">
        <div class="section-head">
          <h2>สนามและราคาต่อชั่วโมง</h2>
          <button class="button dark" @click="editField()">
            <Plus :size="18" /> เพิ่มสนาม
          </button>
        </div>
        <div class="manage-fields">
          <article v-for="f in allFields" :key="f.id">
            <img :src="f.image_url || './field.jpg'" :alt="f.name" />
            <div>
              <h3>{{ f.name }}</h3>
              <p>{{ f.description }}</p>
              <b>฿{{ money(f.price) }} / ชั่วโมง</b
              ><small>{{ Number(f.active) ? "เปิดจอง" : "ปิดจอง" }}</small>
            </div>
            <button class="button outline" @click="editField(f)">แก้ไข</button>
          </article>
        </div>
        <p v-if="!allFields.length && !adminSectionLoading && !adminSectionError" class="muted">
          ยังไม่มีสนาม กด “เพิ่มสนาม” เพื่อเริ่มต้น
        </p>
      </section>
      <section v-if="adminTab === 'settings'" class="panel padding">
        <form class="settings-form" @submit.prevent="saveSettings">
          <div>
            <h2>ข้อมูลสนาม</h2>
            <label
              >ที่อยู่<textarea
                v-model="settingsDraft.address"
                maxlength="3000"
                rows="3"
              ></textarea></label
            ><label
              >ช่องทางติดต่อ<input
                v-model="settingsDraft.contact"
                maxlength="120" /></label
            ><label
              >อุปกรณ์และสิ่งอำนวยความสะดวก (หนึ่งรายการต่อบรรทัด)<textarea
                v-model="settingsDraft.facilities"
                maxlength="3000"
                rows="4"
              ></textarea></label
            ><label
              >โปรโมชั่น<textarea
                v-model="settingsDraft.promotion"
                maxlength="3000"
                rows="3"
              ></textarea></label
            ><div class="promotion-settings">
              <label
                >โค้ดโปรโมชั่น<input
                  v-model.trim="settingsDraft.promotion_code"
                  maxlength="40"
                  placeholder="เช่น No1Sports"
              /></label>
              <label
                >ส่วนลดเปอร์เซ็นต์<input
                  v-model.number="settingsDraft.promotion_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0 = ปิดโปรโมชั่น"
              /></label>
              <p class="small muted">เว้นโค้ดหรือใส่ส่วนลด 0 เพื่อปิดการใช้โปรโมชั่น</p>
            </div
            ><label
              >คำแนะนำและเงื่อนไขการใช้สนาม<textarea
                v-model="settingsDraft.rules"
                maxlength="3000"
                rows="4"
              ></textarea></label
            ><label class="checkbox"
              ><input type="checkbox" v-model="settingsDraft.booking_enabled" />
              เปิดรับจองสนาม</label
            ><p v-if="settingsDirty" class="settings-unsaved" role="status">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p><button class="button dark" :disabled="busy || PREVIEW || !settingsDirty">
              {{ busy ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า' }}
            </button>
            <button class="button outline" type="button" :disabled="busy || !settingsDirty" @click="resetSettingsDraft">คืนค่าที่บันทึกไว้</button>
          </div>
          <div class="bank-panel">
            <h2>บัญชีรับเงิน</h2>
            <span class="bank-logo">K</span>
            <h3>{{ settings.bank_name }}</h3>
            <strong>{{ settings.bank_account }}</strong>
            <p>{{ settings.bank_holder }}</p>
            <label class="upload-box"
              ><Upload :size="24" /> อัปโหลด QR รับเงินจริงจากธนาคาร<input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="uploadQR"
                :disabled="busy || PREVIEW"
            /></label>
            <p class="small muted">
              JPG, PNG หรือ WebP ไม่เกิน 5 MB<br />ตรวจชื่อผู้รับบน QR
              ให้ตรงกับบัญชีก่อนเปิดรับจอง
            </p>
            <img
              v-if="settings.payment_qr"
              class="payment-qr"
              :src="settings.payment_qr"
              alt="QR รับเงินของสนาม"
            />
            <div class="sample-note">
              การยืนยันสลิปทำโดยแอดมิน หลังตรวจยอดเข้าบัญชีจริง
              ระบบไม่ได้เชื่อมตรวจยอดธนาคารอัตโนมัติ
            </div>
          </div>
        </form>
      </section>
      <section v-if="adminTab === 'audit'" class="panel padding">
        <h2>ประวัติการดำเนินการล่าสุด</h2>
        <p v-if="!logs.length && !adminSectionLoading && !adminSectionError" class="muted">
          ยังไม่มีประวัติ{{ PREVIEW ? "ในโหมดตัวอย่าง" : "" }}
        </p>
        <div class="table-wrap">
          <table v-if="logs.length">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ผู้ดำเนินการ</th>
                <th>การดำเนินการ</th>
                <th>รายละเอียด</th>
                <th>จัดการ</th>
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
                    aria-label="ลบประวัติรายการนี้"
                    title="ลบประวัติรายการนี้"
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
