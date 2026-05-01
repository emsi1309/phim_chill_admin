<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">
        <img :src="logoNoBg" alt="PhimChill" class="logo-image" />
        <h2>PhimChill Admin</h2>
        <p>Quản trị hệ thống phim</p>
      </div>

      <transition name="fade">
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
      </transition>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Tên đăng nhập</label>
          <input
            v-model="form.username"
            class="form-control"
            type="text"
            placeholder="Nhập username..."
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Mật khẩu</label>
          <div style="position:relative">
            <input
              v-model="form.password"
              class="form-control"
              :type="showPw ? 'text' : 'password'"
              placeholder="Nhập password..."
              autocomplete="current-password"
              required
              style="padding-right: 42px"
            />
            <button
              type="button"
              @click="showPw = !showPw"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:16px;"
            >
              {{ showPw ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <button
          class="login-submit"
          type="submit"
          :disabled="loading"
        >
          <span v-if="loading">Đang đăng nhập...</span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>

      <p style="text-align:center;margin-top:20px;font-size:12px;color:var(--text-muted)">
        Chỉ dành cho quản trị viên
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoNoBg from '../assets/logo-no-bg.png'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPw = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>
