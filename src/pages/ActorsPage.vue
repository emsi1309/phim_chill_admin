<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">🎭 Quản lý diễn viên - phim</div>
      <div class="d-flex gap-2">
        <input v-model="newName" class="form-control" placeholder="Tên diễn viên..." style="width:220px" />
        <button class="btn btn-sm btn-primary" @click="createActor">+ Thêm</button>
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
          <tr v-for="a in pagedActors" :key="a.id">
            <td>{{ a.id }}</td>
            <td><input v-model="a.name" class="form-control" /></td>
            <td>{{ a.movieCount }}</td>
            <td class="d-flex gap-2">
              <button class="btn btn-sm btn-secondary" @click="updateActor(a)">Lưu</button>
              <button class="btn btn-sm btn-danger" @click="deleteActor(a.id)">Xóa</button>
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
const actors = ref<any[]>([])
const pagedActors = ref<any[]>([])
const newName = ref('')
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)

async function load() {
  const res = await fetch(`${API}/api/admin/actors`, { headers: auth.authHeaders() })
  if (res.ok) {
    actors.value = await res.json()
    applyPaging(0)
  }
}
function applyPaging(p: number) {
  page.value = p
  totalPages.value = Math.max(1, Math.ceil(actors.value.length / size.value))
  if (page.value > totalPages.value - 1) page.value = totalPages.value - 1
  const start = page.value * size.value
  pagedActors.value = actors.value.slice(start, start + size.value)
}
async function createActor() {
  if (!newName.value.trim()) return
  await fetch(`${API}/api/admin/actors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ name: newName.value.trim() })
  })
  newName.value = ''
  await load()
}
async function updateActor(a: any) {
  await fetch(`${API}/api/admin/actors/${a.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ name: a.name })
  })
  await load()
}
async function deleteActor(id: number) {
  await fetch(`${API}/api/admin/actors/${id}`, { method: 'DELETE', headers: auth.authHeaders() })
  await load()
}
onMounted(load)
</script>
