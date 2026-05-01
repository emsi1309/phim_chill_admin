<template>
  <div>
    <!-- STATS GRID -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">🎬</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalMovies ?? '—' }}</div>
          <div class="stat-label">Tổng số phim</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers ?? '—' }}</div>
          <div class="stat-label">Người dùng</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">💬</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalComments ?? '—' }}</div>
          <div class="stat-label">Bình luận</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">⭐</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalRatings ?? '—' }}</div>
          <div class="stat-label">Đánh giá</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cyan">🕷️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalCrawlJobs ?? '—' }}</div>
          <div class="stat-label">Lần crawl</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">⚙️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.runningJobs ?? 0 }}</div>
          <div class="stat-label">Job đang chạy</div>
        </div>
      </div>
    </div>

    <!-- RECENT CRAWL JOBS -->
    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">🕷️ Crawl gần đây</div>
        <RouterLink to="/crawl" class="btn btn-sm btn-secondary">Xem tất cả →</RouterLink>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nguồn</th>
              <th>Trạng thái</th>
              <th>Tìm thấy</th>
              <th>Import</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!recentJobs.length">
              <td colspan="5">
                <div class="empty-state" style="padding:24px">
                  <div>Chưa có job crawl nào</div>
                </div>
              </td>
            </tr>
            <tr v-for="job in recentJobs" :key="job.id">
              <td class="primary">
                <span class="truncate" style="max-width:240px">{{ job.sourceName || job.sourceUrl }}</span>
              </td>
              <td>
                <span :class="statusBadge(job.status)" class="badge">
                  {{ statusIcon(job.status) }} {{ job.status }}
                </span>
              </td>
              <td>{{ job.moviesFound }}</td>
              <td class="text-success">{{ job.moviesImported }}</td>
              <td class="text-muted">{{ formatDate(job.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">⚡ Thao tác nhanh</div>
      </div>
      <div class="card-body">
        <div class="d-flex flex-wrap gap-3">
          <RouterLink to="/crawl" class="btn btn-primary">
            🕷️ Crawl phim mới
          </RouterLink>
          <RouterLink to="/movies" class="btn btn-secondary">
            🎬 Quản lý phim
          </RouterLink>
          <RouterLink to="/users" class="btn btn-secondary">
            👥 Quản lý user
          </RouterLink>
          <a href="http://localhost:8082" target="_blank" class="btn btn-secondary">
            🌐 Xem trang chủ
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API, useAuthStore } from '../stores/auth'

const auth = useAuthStore()

interface Stats {
  totalMovies?: number
  totalUsers?: number
  totalComments?: number
  totalRatings?: number
  totalCrawlJobs?: number
  runningJobs?: number
}

interface CrawlJob {
  id: number
  sourceUrl: string
  sourceName: string
  status: string
  moviesFound: number
  moviesImported: number
  createdAt: string
}

const stats = ref<Stats>({})
const recentJobs = ref<CrawlJob[]>([])

async function loadDashboard() {
  try {
    const [sRes, jRes] = await Promise.all([
      fetch(`${API}/api/admin/stats`, { headers: auth.authHeaders() }),
      fetch(`${API}/api/admin/crawl/jobs`, { headers: auth.authHeaders() })
    ])
    if (sRes.ok) stats.value = await sRes.json()
    if (jRes.ok) {
      const jobs: CrawlJob[] = await jRes.json()
      recentJobs.value = jobs.slice(0, 5)
    }
  } catch (_) {}
}

function statusBadge(s: string) {
  return {
    'badge-green': s === 'DONE',
    'badge-yellow': s === 'RUNNING' || s === 'PENDING',
    'badge-red': s === 'FAILED',
    'badge-gray': !s
  }
}

function statusIcon(s: string) {
  if (s === 'DONE') return '✓'
  if (s === 'RUNNING') return '⟳'
  if (s === 'PENDING') return '⏳'
  if (s === 'FAILED') return '✗'
  return ''
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

onMounted(loadDashboard)
</script>
