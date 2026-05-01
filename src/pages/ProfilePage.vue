<template>
  <div class="card" style="max-width: 780px">
    <div class="card-header">
      <div class="card-title">👤 Profile quản trị viên</div>
    </div>
    <div class="card-body" style="padding: 18px">
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-title">Thông tin tài khoản</div>
        </div>
        <div class="table-wrap">
          <table>
            <tbody>
              <tr><td style="width:180px">Username</td><td>{{ profile.username || '-' }}</td></tr>
              <tr><td>Email</td><td>{{ profile.email || '-' }}</td></tr>
              <tr><td>Role</td><td><span class="badge badge-yellow">{{ profile.role || '-' }}</span></td></tr>
              <tr><td>Ngày tạo</td><td>{{ profile.createdAt || '-' }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4 style="margin-bottom:10px">🔐 Đổi mật khẩu</h4>
      <div class="form-group">
        <label class="form-label">Mật khẩu hiện tại</label>
        <input v-model="form.oldPassword" type="password" class="form-control" autocomplete="current-password" />
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Mật khẩu mới</label>
        <input v-model="form.newPassword" type="password" class="form-control" autocomplete="new-password" />
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Nhập lại mật khẩu mới</label>
        <input v-model="form.confirmPassword" type="password" class="form-control" autocomplete="new-password" />
      </div>

      <p v-if="error" style="color:#f87171;font-size:13px;margin-top:12px">{{ error }}</p>
      <p v-if="success" style="color:#22c55e;font-size:13px;margin-top:12px">{{ success }}</p>

      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <button class="btn btn-primary" :disabled="loading" @click="changePassword">
          {{ loading ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { API, useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const success = ref('')
const profile = ref<any>({})
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

async function loadProfile() {
  const res = await fetch(`${API}/api/admin/profile/me`, { headers: auth.authHeaders() })
  if (!res.ok) return
  const data = await res.json()
  profile.value = {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : ''
  }
}

async function changePassword() {
  error.value = ''
  success.value = ''
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    error.value = 'Vui lòng nhập đầy đủ thông tin'
    return
  }
  if (form.newPassword.length < 6) {
    error.value = 'Mật khẩu mới phải từ 6 ký tự trở lên'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Mật khẩu nhập lại không khớp'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/api/admin/profile/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.authHeaders()
      },
      body: JSON.stringify({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      error.value = data.message || 'Không thể đổi mật khẩu'
      return
    }
    success.value = data.message || 'Đổi mật khẩu thành công'
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e: any) {
    error.value = e.message || 'Không thể đổi mật khẩu'
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

