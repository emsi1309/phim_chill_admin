<template>
  <div>
    <!-- TOOLBAR -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="icon">🔍</span>
        <input
          v-model="search"
          class="form-control"
          placeholder="Tìm kiếm theo tên phim..."
          @input="debouncedSearch"
        />
      </div>
      <select v-model="filterType" class="form-control" style="width:140px" @change="load(0)">
        <option value="">Tất cả loại</option>
        <option value="MOVIE">Phim lẻ</option>
        <option value="SERIES">Phim bộ</option>
      </select>
      <select v-model="filterStatus" class="form-control" style="width:140px" @change="load(0)">
        <option value="">Tất cả trạng thái</option>
        <option value="published">Đã xuất bản</option>
        <option value="draft">Bản nháp</option>
      </select>
      <select v-model.number="pageSize" class="form-control" style="width:110px" @change="load(0)">
        <option :value="20">20 / trang</option>
        <option :value="50">50 / trang</option>
        <option :value="100">100 / trang</option>
      </select>
      <button class="btn btn-sm btn-secondary" :disabled="!selectedIds.length || bulkLoading" @click="bulkRecrawlMetadata">
        ♻️ Meta ({{ selectedIds.length }})
      </button>
      <button class="btn btn-sm btn-secondary" :disabled="!selectedIds.length || bulkLoading" @click="bulkRecrawlSources">
        ♻️ Source ({{ selectedIds.length }})
      </button>
      <button class="btn btn-sm btn-danger" :disabled="!selectedIds.length || bulkLoading" @click="bulkDelete">
        🗑 Xóa ({{ selectedIds.length }})
      </button>
      <div class="pagination-pages" style="margin-left:auto">
        <button class="page-btn" :disabled="currentPage === 0" @click="load(currentPage - 1)">‹</button>
        <button
          v-for="p in visiblePages"
          :key="p"
          class="page-btn"
          :class="{ active: p - 1 === currentPage }"
          @click="load(p - 1)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="currentPage >= totalPages - 1" @click="load(currentPage + 1)">›</button>
      </div>
      <span class="text-muted" style="font-size:12px">{{ totalElements }} phim</span>
    </div>

    <!-- TABLE -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          🎬 Danh sách phim
          <span class="badge badge-gray" style="margin-left:8px">{{ totalElements }}</span>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-secondary" @click="load(currentPage)">↻ Làm mới</button>
          <RouterLink to="/crawl" class="btn btn-sm btn-primary">+ Crawl thêm</RouterLink>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:36px">
                <input type="checkbox" :checked="selectedIds.length === movies.length && movies.length > 0" @change="toggleSelectAll" />
              </th>
              <th style="width:52px">Poster</th>
              <th>Tên phim</th>
              <th>Loại</th>
              <th>Năm</th>
              <th>IMDb</th>
              <th>Thể loại</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted)">Đang tải...</td>
            </tr>
            <tr v-else-if="!movies.length">
              <td colspan="10">
                <div class="empty-state">
                  <div class="icon">🎬</div>
                  <h3>Chưa có phim nào</h3>
                  <p>Crawl phim từ các nguồn để bắt đầu</p>
                </div>
              </td>
            </tr>
            <tr v-for="m in movies" :key="m.id">
              <td>
                <input type="checkbox" :checked="isSelected(m.id)" @change="toggleSelect(m.id)" />
              </td>
              <td>
                <img v-if="m.thumbUrl || m.posterUrl" :src="resolveMediaUrl(m.thumbUrl || m.posterUrl)" class="movie-poster-thumb" :alt="m.titleVi" />
                <div v-else class="no-poster">🎬</div>
              </td>
              <td>
                <div class="primary truncate" style="max-width:200px">{{ m.titleVi }}</div>
                <div class="text-muted truncate" style="font-size:11px;max-width:200px">{{ m.titleOriginal }}</div>
              </td>
              <td>
                <span :class="m.type === 'SERIES' ? 'badge-blue' : 'badge-purple'" class="badge">
                  {{ m.type === 'SERIES' ? '📺 Bộ' : '🎬 Lẻ' }}
                </span>
              </td>
              <td>{{ m.year || '—' }}</td>
              <td>
                <span v-if="m.imdbScore" class="badge badge-yellow">⭐ {{ m.imdbScore }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span class="text-muted truncate" style="max-width:120px;font-size:11px">
                  {{ m.genres ? m.genres.split(',').slice(0, 2).join(', ') : '—' }}
                </span>
              </td>
              <td>
                <span
                  :class="m.status === 'published' ? 'badge-green' : 'badge-gray'"
                  class="badge cursor-pointer"
                  style="cursor:pointer"
                  @click="toggleStatus(m)"
                  :title="m.status === 'published' ? 'Click để ẩn' : 'Click để xuất bản'"
                >
                  {{ m.status === 'published' ? '✓ Xuất bản' : '○ Nháp' }}
                </span>
              </td>
              <td class="text-muted" style="font-size:11px">{{ formatDate(m.createdAt) }}</td>
              <td>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-secondary" :disabled="recrawlLoading === m.id" @click="recrawlMetadata(m)" title="Crawl lại metadata">♻️M</button>
                  <button class="btn btn-sm btn-secondary" :disabled="recrawlLoading === m.id" @click="recrawlSources(m)" title="Crawl lại nguồn">♻️S</button>
                  <button class="btn btn-sm btn-secondary" @click="editMovie(m)" title="Chỉnh sửa">✏️</button>
                  <a :href="`http://localhost:8082/watch/${m.slug}`" target="_blank" class="btn btn-sm btn-secondary" title="Xem">👁</a>
                  <button class="btn btn-sm btn-danger" @click="deleteMovie(m)" title="Xóa">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- EDIT MODAL -->
    <div v-if="editingMovie" class="modal-overlay" @click.self="editingMovie=null">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <div class="modal-title">✏️ Chỉnh sửa phim</div>
          <button class="modal-close" @click="editingMovie=null">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tên tiếng Việt</label>
              <input v-model="editForm.titleVi" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tên gốc</label>
              <input v-model="editForm.titleOriginal" class="form-control" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Năm</label>
              <input v-model.number="editForm.year" class="form-control" type="number" />
            </div>
            <div class="form-group">
              <label class="form-label">IMDb Score</label>
              <input v-model.number="editForm.imdbScore" class="form-control" type="number" step="0.1" min="0" max="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Loại</label>
              <select v-model="editForm.type" class="form-control">
                <option value="MOVIE">Phim lẻ</option>
                <option value="SERIES">Phim bộ</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select v-model="editForm.status" class="form-control">
                <option value="published">Xuất bản</option>
                <option value="draft">Nháp</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Chất lượng</label>
              <select v-model="editForm.quality" class="form-control">
                <option value="FHD">FHD</option>
                <option value="HD">HD</option>
                <option value="SD">SD</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngôn ngữ</label>
              <select v-model="editForm.language" class="form-control">
                <option value="Vietsub">Vietsub</option>
                <option value="Thuyết Minh">Thuyết Minh</option>
                <option value="Lồng Tiếng">Lồng Tiếng</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Quốc gia</label>
              <input v-model="editForm.country" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Số tập</label>
              <input v-model.number="editForm.totalEpisodes" class="form-control" type="number" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Thể loại (phân cách bằng dấu phẩy)</label>
            <input v-model="editForm.genres" class="form-control" placeholder="Hành Động,Phiêu Lưu,Hài Hước..." />
          </div>
          <div class="form-group">
            <label class="form-label">URL Thumb</label>
            <input v-model="editForm.thumbUrl" class="form-control" />
            <div class="d-flex gap-2 mt-2">
              <input type="file" accept="image/*" @change="onThumbFileChange" class="form-control" />
              <button class="btn btn-sm btn-secondary" :disabled="!thumbFile || uploadLoading" @click="uploadThumb">
                Upload Thumb
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">URL Poster</label>
            <input v-model="editForm.posterUrl" class="form-control" />
            <div class="d-flex gap-2 mt-2">
              <input type="file" accept="image/*" @change="onPosterFileChange" class="form-control" />
              <button class="btn btn-sm btn-secondary" :disabled="!posterFile || uploadLoading" @click="uploadPoster">
                Upload Poster
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">URL Backdrop</label>
            <input v-model="editForm.backdropUrl" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea v-model="editForm.description" class="form-control" rows="4"></textarea>
          </div>

          <!-- Preview poster -->
          <div v-if="editForm.thumbUrl || editForm.posterUrl || editForm.backdropUrl" class="mt-3">
            <label class="form-label">Preview ảnh</label>
            <div class="d-flex gap-3 align-center">
              <img v-if="editForm.thumbUrl" :src="resolveMediaUrl(editForm.thumbUrl)" style="height:120px;width:auto;border-radius:6px;object-fit:cover" />
              <img v-if="editForm.posterUrl" :src="resolveMediaUrl(editForm.posterUrl)" style="height:120px;width:auto;border-radius:6px;object-fit:cover" />
              <img v-if="editForm.backdropUrl" :src="resolveMediaUrl(editForm.backdropUrl)" style="height:80px;width:auto;border-radius:6px;object-fit:cover" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingMovie=null">Hủy</button>
          <button class="btn btn-primary" :disabled="saveLoading" @click="saveMovie">
            {{ saveLoading ? 'Đang lưu...' : '💾 Lưu thay đổi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { API, useAuthStore, resolveMediaUrl } from '../stores/auth'

const auth = useAuthStore()

interface Movie {
  id: number
  slug: string
  titleVi: string
  titleOriginal: string
  year: number
  imdbScore: number
  quality: string
  language: string
  description: string
  thumbUrl: string
  posterUrl: string
  backdropUrl: string
  genres: string
  country: string
  type: string
  status: string
  totalEpisodes: number
  createdAt: string
}

const movies = ref<Movie[]>([])
const loading = ref(false)
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(0)
const totalPages = ref(1)
const totalElements = ref(0)
const pageSize = ref(20)

const editingMovie = ref<Movie | null>(null)
const editForm = ref<Partial<Movie>>({})
const saveLoading = ref(false)
const recrawlLoading = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const bulkLoading = ref(false)
const thumbFile = ref<File | null>(null)
const posterFile = ref<File | null>(null)
const uploadLoading = ref(false)

const visiblePages = computed(() => {
  const arr = []
  const start = Math.max(1, currentPage.value)
  const end = Math.min(totalPages.value, currentPage.value + 5)
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

async function load(page: number) {
  loading.value = true
  currentPage.value = page
  try {
    let url = `${API}/api/admin/movies?page=${page}&size=${pageSize.value}`
    if (search.value) url += `&q=${encodeURIComponent(search.value)}`
    const res = await fetch(url, { headers: auth.authHeaders() })
    if (res.ok) {
      const data = await res.json()
      movies.value = data.content
      totalPages.value = data.totalPages
      totalElements.value = data.totalElements
      selectedIds.value = selectedIds.value.filter(id => movies.value.some(m => m.id === id))
    }
  } catch (_) {}
  loading.value = false
}

let searchTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(0), 400)
}

function editMovie(m: Movie) {
  editingMovie.value = m
  editForm.value = { ...m }
  thumbFile.value = null
  posterFile.value = null
}

async function saveMovie() {
  if (!editingMovie.value) return
  saveLoading.value = true
  try {
    const res = await fetch(`${API}/api/admin/movies/${editingMovie.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
      body: JSON.stringify(editForm.value)
    })
    if (res.ok) {
      editingMovie.value = null
      await load(currentPage.value)
    }
  } catch (_) {}
  saveLoading.value = false
}

async function toggleStatus(m: Movie) {
  await fetch(`${API}/api/admin/movies/${m.id}/status`, {
    method: 'PATCH',
    headers: auth.authHeaders()
  })
  await load(currentPage.value)
}

async function deleteMovie(m: Movie) {
  if (!confirm(`Xóa phim "${m.titleVi}"?`)) return
  await fetch(`${API}/api/admin/movies/${m.id}`, {
    method: 'DELETE',
    headers: auth.authHeaders()
  })
  await load(currentPage.value)
}

function toggleSelectAll() {
  if (selectedIds.value.length === movies.value.length) {
    selectedIds.value = []
    return
  }
  selectedIds.value = movies.value.map(m => m.id)
}

function isSelected(id: number) {
  return selectedIds.value.includes(id)
}

function toggleSelect(id: number) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(x => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

async function bulkRecrawlMetadata() {
  if (!selectedIds.value.length) return
  bulkLoading.value = true
  try {
    await Promise.all(selectedIds.value.map(id =>
      fetch(`${API}/api/admin/movies/${id}/recrawl-metadata`, { method: 'POST', headers: auth.authHeaders() })
    ))
    await load(currentPage.value)
  } finally {
    bulkLoading.value = false
  }
}

async function bulkRecrawlSources() {
  if (!selectedIds.value.length) return
  bulkLoading.value = true
  try {
    await Promise.all(selectedIds.value.map(id =>
      fetch(`${API}/api/admin/movies/${id}/recrawl-sources`, { method: 'POST', headers: auth.authHeaders() })
    ))
    await load(currentPage.value)
  } finally {
    bulkLoading.value = false
  }
}

async function bulkDelete() {
  if (!selectedIds.value.length) return
  if (!confirm(`Xóa ${selectedIds.value.length} phim đã chọn?`)) return
  bulkLoading.value = true
  try {
    await Promise.all(selectedIds.value.map(id =>
      fetch(`${API}/api/admin/movies/${id}`, { method: 'DELETE', headers: auth.authHeaders() })
    ))
    selectedIds.value = []
    await load(currentPage.value)
  } finally {
    bulkLoading.value = false
  }
}

async function recrawlMetadata(m: Movie) {
  recrawlLoading.value = m.id
  try {
    await fetch(`${API}/api/admin/movies/${m.id}/recrawl-metadata`, {
      method: 'POST',
      headers: auth.authHeaders()
    })
    await load(currentPage.value)
  } finally {
    recrawlLoading.value = null
  }
}

async function recrawlSources(m: Movie) {
  recrawlLoading.value = m.id
  try {
    await fetch(`${API}/api/admin/movies/${m.id}/recrawl-sources`, {
      method: 'POST',
      headers: auth.authHeaders()
    })
    await load(currentPage.value)
  } finally {
    recrawlLoading.value = null
  }
}

function onThumbFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  thumbFile.value = input.files?.[0] || null
}

function onPosterFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  posterFile.value = input.files?.[0] || null
}

async function uploadThumb() {
  if (!editingMovie.value || !thumbFile.value) return
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', thumbFile.value)
    const res = await fetch(`${API}/api/admin/movies/${editingMovie.value.id}/upload-thumb`, {
      method: 'POST',
      headers: auth.authHeaders(),
      body: fd
    })
    if (res.ok) {
      const data = await res.json()
      editForm.value.thumbUrl = data.thumbUrl
    }
  } finally {
    uploadLoading.value = false
  }
}

async function uploadPoster() {
  if (!editingMovie.value || !posterFile.value) return
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', posterFile.value)
    const res = await fetch(`${API}/api/admin/movies/${editingMovie.value.id}/upload-poster`, {
      method: 'POST',
      headers: auth.authHeaders(),
      body: fd
    })
    if (res.ok) {
      const data = await res.json()
      editForm.value.posterUrl = data.posterUrl
    }
  } finally {
    uploadLoading.value = false
  }
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

onMounted(() => load(0))
</script>
