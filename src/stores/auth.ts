import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const API = 'http://localhost:8081'

function normalizeRole(role?: string): string {
  if (!role) return ''
  let value = String(role).trim().toUpperCase()
  if (value.startsWith('ROLE_')) value = value.slice(5)
  return value
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const username = ref<string>(localStorage.getItem('admin_user') || '')
  const role = ref<string>(normalizeRole(localStorage.getItem('admin_role') || ''))

  const isLoggedIn = computed(() => !!token.value && normalizeRole(role.value) === 'ADMIN')

  function authHeaders(): Record<string, string> {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  async function login(user: string, pass: string): Promise<void> {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Đăng nhập thất bại')
    }
    const data = await res.json()
    const incomingRole = normalizeRole(data.role)
    if (incomingRole !== 'ADMIN') throw new Error('Bạn không có quyền admin')
    token.value = data.token
    username.value = data.username
    role.value = incomingRole
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', data.username)
    localStorage.setItem('admin_role', incomingRole)
  }

  function logout() {
    token.value = ''
    username.value = ''
    role.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_role')
  }

  return { token, username, role, isLoggedIn, authHeaders, login, logout }
})

export function resolveMediaUrl(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${API}${url}`
  return `${API}/${url}`
}
