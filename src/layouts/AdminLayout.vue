<template>
  <div class="admin-shell">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img :src="logoNoBg" alt="PhimChill" class="logo-image" />
        <div>
          <h1>PhimChill</h1>
          <span>Admin Panel</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Tổng quan</div>
        <RouterLink to="/dashboard" class="nav-item" active-class="active">
          <span class="nav-icon">📊</span>
          Dashboard
        </RouterLink>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Quản lý nội dung</div>
        <RouterLink to="/movies" class="nav-item" active-class="active">
          <span class="nav-icon">🎬</span>
          Phim
          <span v-if="movieCount" class="badge badge-gray ml-auto" style="margin-left:auto;font-size:10px">{{ movieCount }}</span>
        </RouterLink>
        <RouterLink to="/genres" class="nav-item" active-class="active">
          <span class="nav-icon">🏷️</span>
          Thể loại
        </RouterLink>
        <RouterLink to="/actors" class="nav-item" active-class="active">
          <span class="nav-icon">🎭</span>
          Diễn viên
        </RouterLink>
        <RouterLink to="/comments" class="nav-item" active-class="active">
          <span class="nav-icon">💬</span>
          Bình luận
        </RouterLink>
        <RouterLink to="/users" class="nav-item" active-class="active">
          <span class="nav-icon">👥</span>
          Người dùng
        </RouterLink>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Crawler</div>
        <RouterLink to="/crawl" class="nav-item" active-class="active">
          <span class="nav-icon">🕷️</span>
          Crawl phim
          <span v-if="runningJobs" class="badge badge-yellow" style="margin-left:auto;font-size:10px">{{ runningJobs }} đang chạy</span>
        </RouterLink>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">{{ auth.username.charAt(0).toUpperCase() }}</div>
          <div class="info">
            <div class="uname">{{ auth.username }}</div>
            <div class="urole">Administrator</div>
          </div>
          <button class="logout-btn" @click="logout" title="Đăng xuất">⏻</button>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <div class="main-area">
      <header class="topbar">
        <span class="topbar-title">{{ currentPageTitle }}</span>
        <div class="topbar-actions">
          <span style="font-size:12px;color:var(--text-muted)">{{ now }}</span>
        </div>
      </header>

      <main class="page-content">
        <transition name="slide" mode="out-in">
          <RouterView />
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { API } from '../stores/auth'
import logoNoBg from '../assets/logo-no-bg.png'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const movieCount = ref<number>(0)
const runningJobs = ref<number>(0)
const now = ref('')

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/movies': 'Quản lý phim',
  '/genres': 'Quản lý thể loại',
  '/actors': 'Quản lý diễn viên',
  '/comments': 'Quản lý bình luận',
  '/crawl': 'Crawl phim',
  '/users': 'Người dùng',
}

const currentPageTitle = computed(() => titles[route.path] || 'Admin')

function logout() {
  auth.logout()
  router.push('/login')
}

function updateTime() {
  now.value = new Date().toLocaleString('vi-VN')
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/admin/stats`, { headers: auth.authHeaders() })
    if (res.ok) {
      const data = await res.json()
      movieCount.value = data.totalMovies
      runningJobs.value = data.runningJobs
    }
  } catch (_) {}
}

let timer: ReturnType<typeof setInterval>
let statsTimer: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadStats()
  statsTimer = setInterval(loadStats, 15000)
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(statsTimer)
})
</script>
