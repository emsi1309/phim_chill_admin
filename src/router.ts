import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import LoginPage from './pages/LoginPage.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import DashboardPage from './pages/DashboardPage.vue'
import MoviesPage from './pages/MoviesPage.vue'
import CrawlPage from './pages/CrawlPage.vue'
import UsersPage from './pages/UsersPage.vue'
import GenresPage from './pages/GenresPage.vue'
import ActorsPage from './pages/ActorsPage.vue'
import CommentsPage from './pages/CommentsPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: LoginPage,
      meta: { public: true }
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: DashboardPage },
        { path: 'movies', component: MoviesPage },
        { path: 'genres', component: GenresPage },
        { path: 'actors', component: ActorsPage },
        { path: 'comments', component: CommentsPage },
        { path: 'crawl', component: CrawlPage },
        { path: 'users', component: UsersPage }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
})
