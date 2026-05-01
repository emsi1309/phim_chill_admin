<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">🏷️ Quản lý thể loại</div>
      <div class="d-flex gap-2">
        <input v-model="newName" class="form-control" placeholder="Tên thể loại..." style="width:220px" />
        <button class="btn btn-sm btn-primary" @click="createGenre">+ Thêm</button>
        <select v-model.number="size" class="form-control" style="width:110px" @change="applyPaging(0)">
          <option :value="20">20</option><option :value="50">50</option><option :value="100">100</option>
        </select>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="page===0" @click="applyPaging(page-1)">‹</button>
          <button class="page-btn" :disabled="page>=totalPages-1" @click="applyPaging(page+1)">›</button>
        </div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Tên</th><th>Số phim</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="g in pagedGenres" :key="g.id">
            <td>{{ g.id }}</td>
            <td><input v-model="g.name" class="form-control" /></td>
            <td>{{ g.movieCount }}</td>
            <td class="d-flex gap-2">
              <button class="btn btn-sm btn-secondary" @click="updateGenre(g)">Lưu</button>
              <button class="btn btn-sm btn-danger" @click="deleteGenre(g.id)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { API, useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const genres = ref<any[]>([])
const pagedGenres = ref<any[]>([])
const newName = ref('')
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)

async function load() {
  const res = await fetch(`${API}/api/admin/genres`, { headers: auth.authHeaders() })
  if (res.ok) {
    genres.value = await res.json()
    applyPaging(0)
  }
}
function applyPaging(p: number) {
  page.value = p
  totalPages.value = Math.max(1, Math.ceil(genres.value.length / size.value))
  if (page.value > totalPages.value - 1) page.value = totalPages.value - 1
  const start = page.value * size.value
  pagedGenres.value = genres.value.slice(start, start + size.value)
}
async function createGenre() {
  if (!newName.value.trim()) return
  await fetch(`${API}/api/admin/genres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ name: newName.value.trim() })
  })
  newName.value = ''
  await load()
}
async function updateGenre(g: any) {
  await fetch(`${API}/api/admin/genres/${g.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ name: g.name })
  })
  await load()
}
async function deleteGenre(id: number) {
  await fetch(`${API}/api/admin/genres/${id}`, { method: 'DELETE', headers: auth.authHeaders() })
  await load()
}
onMounted(load)
</script>
