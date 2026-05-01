<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">💬 Quản lý bình luận</div>
      <div class="d-flex gap-2">
        <input v-model="q" class="form-control" placeholder="Tìm theo user/nội dung..." style="width:260px" @input="load(0)" />
        <select v-model.number="size" class="form-control" style="width:110px" @change="load(0)">
          <option :value="20">20</option><option :value="50">50</option><option :value="100">100</option>
        </select>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="page===0" @click="load(page-1)">‹</button>
          <button class="page-btn" :disabled="page>=totalPages-1" @click="load(page+1)">›</button>
        </div>
        <span class="text-muted" style="font-size:12px;align-self:center">{{ total }} bình luận</span>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>User</th><th>Phim</th><th>Nội dung</th><th>Ngày tạo</th><th></th></tr></thead>
        <tbody>
          <tr v-for="c in comments" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.username }}</td>
            <td>{{ c.movieTitle || '—' }}</td>
            <td style="max-width:420px">{{ c.content }}</td>
            <td>{{ new Date(c.createdAt).toLocaleString('vi-VN') }}</td>
            <td><button class="btn btn-sm btn-danger" @click="del(c.id)">Xóa</button></td>
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
const comments = ref<any[]>([])
const q = ref('')
const size = ref(20)
const page = ref(0)
const totalPages = ref(1)
const total = ref(0)

async function load(p = 0) {
  page.value = p
  const url = `${API}/api/admin/comments?page=${p}&size=${size.value}${q.value ? `&q=${encodeURIComponent(q.value)}` : ''}`
  const res = await fetch(url, { headers: auth.authHeaders() })
  if (res.ok) {
    const data = await res.json()
    comments.value = data.content
    totalPages.value = data.totalPages
    total.value = data.totalElements
  }
}
async function del(id: number) {
  await fetch(`${API}/api/admin/comments/${id}`, { method: 'DELETE', headers: auth.authHeaders() })
  await load(page.value)
}
onMounted(() => load(0))
</script>
