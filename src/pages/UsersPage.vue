<template>
  <div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">👥 Quản lý người dùng</div>
        <div class="d-flex gap-2" style="margin-left:auto">
          <select v-model.number="size" class="form-control" style="width:110px" @change="applyPaging(0)">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <div class="pagination-pages">
            <button class="page-btn" :disabled="page===0" @click="applyPaging(page-1)">‹</button>
            <button class="page-btn" :disabled="page>=totalPages-1" @click="applyPaging(page+1)">›</button>
          </div>
          <button class="btn btn-sm btn-secondary" @click="load">↻ Làm mới</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tài khoản</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pagedUsers.length">
              <td colspan="6">
                <div class="empty-state">
                  <div class="icon">👥</div>
                  <h3>Chưa có người dùng</h3>
                </div>
              </td>
            </tr>
            <tr v-for="u in pagedUsers" :key="u.id">
              <td class="text-muted">{{ u.id }}</td>
              <td>
                <div class="d-flex align-center gap-2">
                  <div class="avatar" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#7c5cfc);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">
                    {{ u.username.charAt(0).toUpperCase() }}
                  </div>
                  <span class="primary">{{ u.username }}</span>
                </div>
              </td>
              <td class="text-secondary">{{ u.email }}</td>
              <td>
                <select
                  :value="u.role"
                  class="form-control"
                  style="width:110px;padding:4px 8px;font-size:12px"
                  @change="changeRole(u, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td class="text-muted">{{ formatDate(u.createdAt) }}</td>
              <td>
                <button
                  class="btn btn-sm btn-danger"
                  @click="deleteUser(u)"
                  :disabled="u.username === currentAdmin"
                >
                  🗑 Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API, useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const currentAdmin = auth.username

interface User {
  id: number
  username: string
  email: string
  role: string
  createdAt: string
}

const users = ref<User[]>([])
const pagedUsers = ref<User[]>([])
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)

async function load() {
  const res = await fetch(`${API}/api/admin/users`, { headers: auth.authHeaders() })
  if (res.ok) {
    users.value = await res.json()
    applyPaging(0)
  }
}

function applyPaging(p: number) {
  page.value = p
  totalPages.value = Math.max(1, Math.ceil(users.value.length / size.value))
  if (page.value > totalPages.value - 1) page.value = totalPages.value - 1
  const start = page.value * size.value
  pagedUsers.value = users.value.slice(start, start + size.value)
}

async function changeRole(u: User, role: string) {
  await fetch(`${API}/api/admin/users/${u.id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ role })
  })
  u.role = role
}

async function deleteUser(u: User) {
  if (!confirm(`Xóa tài khoản "${u.username}"?`)) return
  await fetch(`${API}/api/admin/users/${u.id}`, {
    method: 'DELETE',
    headers: auth.authHeaders()
  })
  await load()
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

onMounted(load)
</script>
