<template>
  <div>
    <!-- CRAWL FORM -->
    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">🕷️ Crawl phim mới</div>
      </div>
      <div class="card-body">
        <div class="form-row mb-4">
          <!-- Preset sources -->
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Nguồn phim có sẵn</label>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="src in presetSources"
                :key="src.url"
                class="btn btn-sm"
                :class="crawlForm.url === src.url ? 'btn-primary' : 'btn-secondary'"
                @click="selectPreset(src)"
              >
                {{ src.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs: List page / Single movie -->
        <div class="d-flex gap-2 mb-4">
          <button
            class="btn"
            :class="crawlMode === 'list' ? 'btn-primary' : 'btn-secondary'"
            @click="crawlMode = 'list'"
          >
            📋 Crawl danh sách
          </button>
          <button
            class="btn"
            :class="crawlMode === 'single' ? 'btn-primary' : 'btn-secondary'"
            @click="crawlMode = 'single'"
          >
            🎬 Crawl 1 phim
          </button>
        </div>

        <transition name="fade" mode="out-in">
          <!-- Crawl list page -->
          <div v-if="crawlMode === 'list'" key="list">
            <div class="form-row">
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">URL danh sách phim</label>
                <input
                  v-model="crawlForm.url"
                  class="form-control"
                  placeholder="Ví dụ: https://ccftootingbec.org.uk/the-loai/hanh-dong"
                />
                <p class="text-muted mt-1" style="font-size:11px">Nhập URL trang danh sách phim (trang chủ, thể loại, quốc gia...)</p>
              </div>
              <div class="form-group">
                <label class="form-label">Số trang tối đa</label>
                <input type="number" min="1" v-model.number="crawlForm.maxPages" class="form-control" />
                <p class="text-muted mt-1" style="font-size:11px">Nhập số trang tối đa (mặc định 1)</p>
              </div>
              <div class="form-group">
                <label class="form-label">Chế độ khi gặp phim trùng</label>
                <div>
                  <label style="display:block; margin-bottom:8px"><input type="radio" v-model.number="crawlForm.mode" :value="1" /> Mode 1: Crawl lại toàn bộ (sources + metadata)</label>
                  <label style="display:block"><input type="radio" v-model.number="crawlForm.mode" :value="2" /> Mode 2: Chỉ crawl lại metadata</label>
                </div>
              </div>
            </div>
            <div class="d-flex gap-3">
              <button
                class="btn btn-primary"
                :disabled="!crawlForm.url || listLoading"
                @click="startListCrawl"
              >
                <span v-if="listLoading">⟳ Đang khởi động...</span>
                <span v-else>🚀 Bắt đầu crawl</span>
              </button>
              <button class="btn btn-secondary" @click="crawlForm.url='';crawlForm.maxPages=1">
                Xóa
              </button>
            </div>
          </div>

          <!-- Crawl single movie -->
          <div v-else key="single">
            <div class="form-group">
              <label class="form-label">URL phim cụ thể</label>
              <div class="input-with-btn">
                <input
                  v-model="singleUrl"
                  class="form-control"
                  placeholder="Ví dụ: https://ccftootingbec.org.uk/phim/bi-kip-luyen-rong-..."
                />
                <button
                  class="btn btn-primary"
                  :disabled="!singleUrl || singleLoading"
                  @click="crawlSingle"
                >
                  <span v-if="singleLoading">⟳</span>
                  <span v-else>Crawl</span>
                </button>
              </div>
              <p class="text-muted mt-1" style="font-size:11px">Nhập URL trang phim (không cần URL tập phim cụ thể)</p>
            </div>
            <transition name="fade">
              <div v-if="singleResult" class="alert alert-success">
                ✓ Đã import: <strong>{{ singleResult.titleVi }}</strong> ({{ singleResult.year }})
              </div>
            </transition>
            <transition name="fade">
              <div v-if="singleError" class="alert alert-danger">✗ {{ singleError }}</div>
            </transition>
          </div>
        </transition>
      </div>
    </div>

    <!-- CRAWL JOBS -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Lịch sử crawl</div>
        <div class="d-flex gap-2" style="margin-left:auto">
          <select v-model.number="size" class="form-control" style="width:110px" @change="applyPaging(0)">
            <option :value="20">20</option><option :value="50">50</option><option :value="100">100</option>
          </select>
          <div class="pagination-pages">
            <button class="page-btn" :disabled="page===0" @click="applyPaging(page-1)">‹</button>
            <button class="page-btn" :disabled="page>=totalPages-1" @click="applyPaging(page+1)">›</button>
          </div>
          <button class="btn btn-sm btn-secondary" @click="loadJobs">↻ Làm mới</button>
        </div>
      </div>

      <div v-if="activeJob" class="card-body" style="border-bottom:1px solid var(--border)">
        <!-- Active job progress -->
        <div class="d-flex justify-between align-center mb-2">
          <div class="d-flex align-center gap-2">
            <span class="badge badge-yellow">⟳ ĐANG CHẠY</span>
            <span class="text-secondary" style="font-size:12px">{{ activeJob.sourceName || activeJob.sourceUrl }}</span>
          </div>
          <div class="d-flex align-center gap-3" style="font-size:12px;color:var(--text-muted)">
            <span>Tìm thấy: <strong class="text-primary">{{ activeJob.moviesFound }}</strong></span>
            <span>Import: <strong class="text-success">{{ activeJob.moviesImported }}</strong></span>
            <span>Lỗi: <strong class="text-danger">{{ activeJob.moviesFailed }}</strong></span>
          </div>
          <div style="margin-left:12px">
            <button class="btn btn-sm btn-danger" @click="stopActiveJob">⏹ Dừng</button>
          </div>
        </div>
        <div class="progress mb-3">
          <div
            class="progress-bar"
            :style="{width: activeJob.moviesFound ? `${(activeJob.moviesImported / activeJob.moviesFound * 100).toFixed(0)}%` : '5%'}"
          ></div>
        </div>
        <div class="log-terminal" ref="logRef">
          <span
            v-for="(line, i) in logLines"
            :key="i"
            :class="lineClass(line)"
          >{{ line }}<br /></span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nguồn</th>
              <th>Trạng thái</th>
              <th>Tìm thấy</th>
              <th>Import</th>
              <th>Lỗi</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pagedJobs.length">
              <td colspan="9">
                <div class="empty-state">
                  <div class="icon">🕷️</div>
                  <h3>Chưa có job crawl nào</h3>
                  <p>Sử dụng form trên để bắt đầu crawl phim</p>
                </div>
              </td>
            </tr>
            <tr v-for="job in pagedJobs" :key="job.id">
              <td class="text-muted">{{ job.id }}</td>
              <td>
                <div class="primary truncate" style="max-width:220px">{{ job.sourceName || '—' }}</div>
                <div class="text-muted" style="font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ job.sourceUrl }}</div>
              </td>
              <td>
                <span :class="statusBadge(job.status)" class="badge">
                  {{ statusIcon(job.status) }} {{ job.status }}
                </span>
              </td>
              <td>{{ job.moviesFound }}</td>
              <td class="text-success">{{ job.moviesImported }}</td>
              <td :class="job.moviesFailed ? 'text-danger' : 'text-muted'">{{ job.moviesFailed }}</td>
              <td class="text-muted">{{ formatDate(job.startedAt) }}</td>
              <td class="text-muted">{{ formatDate(job.finishedAt) }}</td>
              <td>
                <div class="d-flex gap-2">
                  <button
                    class="btn btn-sm btn-secondary"
                    @click="viewLog(job)"
                    title="Xem log"
                  >📋</button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="deleteJob(job.id)"
                    title="Xóa"
                  >🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- LOG MODAL -->
    <div v-if="logModal" class="modal-overlay" @click.self="logModal=null">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            📋 Log — Job #{{ logModal.id }}
            <span :class="statusBadge(logModal.status)" class="badge" style="margin-left:8px">{{ logModal.status }}</span>
          </div>
          <button class="modal-close" @click="logModal=null">✕</button>
        </div>
        <div class="modal-body" style="padding:0">
          <div class="log-terminal" style="height:400px;border:none;border-radius:0">
            <template v-if="logModal.logMessages">
              <span
                v-for="(line, i) in logModal.logMessages.split('\n')"
                :key="i"
                :class="lineClass(line)"
              >{{ line }}<br /></span>
            </template>
            <span v-else class="text-muted">Không có log</span>
          </div>
          <div v-if="logModal.errorMessage" class="alert alert-danger" style="margin:16px">
            {{ logModal.errorMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { API, useAuthStore } from '../stores/auth'

const auth = useAuthStore()

interface CrawlJob {
  id: number
  sourceUrl: string
  sourceName: string
  status: string
  moviesFound: number
  moviesImported: number
  moviesFailed: number
  logMessages: string
  errorMessage: string
  startedAt: string
  finishedAt: string
  createdAt: string
}

// Preset sources
const presetSources = [
  { name: '🎬 Phim Chiếu Rạp', url: 'https://ccftootingbec.org.uk/danh-sach/phim-chieu-rap' },
  { name: '📺 Phim Bộ', url: 'https://ccftootingbec.org.uk/danh-sach/phim-bo' },
  { name: '🎞️ Phim Lẻ', url: 'https://ccftootingbec.org.uk/danh-sach/phim-le' },
  { name: '🆕 Phim Mới', url: 'https://ccftootingbec.org.uk/danh-sach/phim-moi-cap-nhat' },
  { name: '🏠 Trang chủ', url: 'https://ccftootingbec.org.uk/' },
  { name: '⚔️ Hành Động', url: 'https://ccftootingbec.org.uk/the-loai/hanh-dong' },
  { name: '❤️ Tình Cảm', url: 'https://ccftootingbec.org.uk/the-loai/tinh-cam' },
  { name: '😂 Hài Hước', url: 'https://ccftootingbec.org.uk/the-loai/hai-huoc' },
  { name: '🇰🇷 Hàn Quốc', url: 'https://ccftootingbec.org.uk/quoc-gia/han-quoc' },
  { name: '🇺🇸 Âu Mỹ', url: 'https://ccftootingbec.org.uk/quoc-gia/au-my' },
]

const crawlMode = ref<'list' | 'single'>('list')
const crawlForm = ref({ url: '', maxPages: 1, mode: 1 })
const singleUrl = ref('')
const listLoading = ref(false)
const singleLoading = ref(false)
const singleResult = ref<any>(null)
const singleError = ref('')
const jobs = ref<CrawlJob[]>([])
const pagedJobs = ref<CrawlJob[]>([])
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)
const logModal = ref<CrawlJob | null>(null)
const logRef = ref<HTMLElement>()

const activeJob = computed(() => jobs.value.find(j => j.status === 'RUNNING'))

const logLines = computed(() => {
  if (!activeJob.value?.logMessages) return []
  return activeJob.value.logMessages.split('\n').filter(Boolean)
})

function selectPreset(src: { name: string; url: string }) {
  crawlForm.value.url = src.url
  crawlMode.value = 'list'
}

async function startListCrawl() {
  if (!crawlForm.value.url) return
  listLoading.value = true
  try {
    // show confirmation about chosen mode
    const chosenMode = crawlForm.value.mode || 1
    const modeText = chosenMode === 1
      ? 'Mode 1: Crawl lại toàn bộ khi gặp phim trùng (nguồn + metadata)'
      : 'Mode 2: Chỉ crawl lại metadata khi gặp phim trùng'
    if (!confirm(`Bạn chọn: ${modeText}\nTiếp tục?`)) {
      listLoading.value = false
      return
    }

    const res = await fetch(`${API}/api/admin/crawl/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
      body: JSON.stringify({ url: crawlForm.value.url, maxPages: crawlForm.value.maxPages, mode: crawlForm.value.mode })
    })
    if (res.ok) {
      await loadJobs()
      startPolling()
    }
  } catch (_) {}
  listLoading.value = false
}

async function crawlSingle() {
  if (!singleUrl.value) return
  singleLoading.value = true
  singleResult.value = null
  singleError.value = ''
  try {
    const res = await fetch(`${API}/api/admin/crawl/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
      body: JSON.stringify({ url: singleUrl.value })
    })
    if (res.ok) {
      singleResult.value = await res.json()
      singleUrl.value = ''
    } else {
      const err = await res.json().catch(() => ({}))
      singleError.value = err.message || 'Crawl thất bại'
    }
  } catch (e: any) {
    singleError.value = e.message
  }
  singleLoading.value = false
}

async function loadJobs() {
  try {
    const res = await fetch(`${API}/api/admin/crawl/jobs`, { headers: auth.authHeaders() })
    if (res.ok) {
      jobs.value = await res.json()
      applyPaging(0)
    }
  } catch (_) {}
}

function applyPaging(p: number) {
  page.value = p
  totalPages.value = Math.max(1, Math.ceil(jobs.value.length / size.value))
  if (page.value > totalPages.value - 1) page.value = totalPages.value - 1
  const start = page.value * size.value
  pagedJobs.value = jobs.value.slice(start, start + size.value)
}

async function deleteJob(id: number) {
  if (!confirm('Xóa job này?')) return
  await fetch(`${API}/api/admin/crawl/jobs/${id}`, {
    method: 'DELETE',
    headers: auth.authHeaders()
  })
  await loadJobs()
}

function viewLog(job: CrawlJob) {
  logModal.value = job
}

// Polling for active jobs
let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await loadJobs()
    const active = jobs.value.find(j => j.status === 'RUNNING' || j.status === 'PENDING')
    if (!active && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    // Auto scroll log
    nextTick(() => {
      if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight
    })
  }, 2000)
}

function statusBadge(s: string) {
  if (s === 'DONE') return 'badge-green'
  if (s === 'RUNNING') return 'badge-yellow'
  if (s === 'PENDING') return 'badge-yellow'
  if (s === 'FAILED') return 'badge-red'
  return 'badge-gray'
}

function statusIcon(s: string) {
  if (s === 'DONE') return '✓'
  if (s === 'RUNNING') return '⟳'
  if (s === 'PENDING') return '⏳'
  if (s === 'FAILED') return '✗'
  return ''
}

async function stopActiveJob() {
  if (!activeJob.value) return
  if (!confirm('Dừng job crawl đang chạy?')) return
  try {
    await fetch(`${API}/api/admin/crawl/jobs/${activeJob.value.id}/stop`, {
      method: 'POST',
      headers: auth.authHeaders()
    })
    await loadJobs()
  } catch (_) {}
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function lineClass(line: string) {
  if (!line) return ''
  if (line.startsWith('✗') || line.includes('Lỗi') || line.includes('Error')) return 'log-error'
  if (line.startsWith('✓') || line.includes('Hoàn thành')) return 'log-done'
  if (line.startsWith('→') || line.startsWith('⚙')) return 'log-info'
  return ''
}

onMounted(async () => {
  await loadJobs()
  if (jobs.value.some(j => j.status === 'RUNNING' || j.status === 'PENDING')) startPolling()
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
