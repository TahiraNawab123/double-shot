import { cookies } from 'next/headers'
import AdminDashboardWrapper from '@/components/admin-dashboard-wrapper'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('session_user')
  let isAdmin = false

  if (userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value))
      if (user.role === 'admin') {
        isAdmin = true
      }
    } catch (e) {
      // JSON parse or URI decode error
    }
  }

  return <AdminDashboardWrapper isAdmin={isAdmin} />
}
