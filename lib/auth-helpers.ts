// Client-side authentication helpers using localStorage and cookies

export interface User {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'customer' | 'admin';
}

const DEFAULT_ADMINS: User[] = [
  {
    name: 'Hamza Ali',
    email: 'hamza@doubleshot.com',
    phone: '03001234567',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 of 'admin123'
    role: 'admin'
  },
  {
    name: 'Ayesha Khan',
    email: 'ayesha@doubleshot.com',
    phone: '03007654321',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 of 'admin123'
    role: 'admin'
  }
];

// SHA-256 hashing helper
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getRegisteredUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_ADMINS;
  try {
    const raw = localStorage.getItem('registeredUsers');
    if (!raw) {
      localStorage.setItem('registeredUsers', JSON.stringify(DEFAULT_ADMINS));
      return DEFAULT_ADMINS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ADMINS;
  }
}

export function saveRegisteredUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  } catch {}
}

export function setSessionCookie(user: { name: string; email: string; role: string }) {
  if (typeof window === 'undefined') return;
  // Expire in 1 day
  const expiry = 60 * 60 * 24;
  document.cookie = `session_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${expiry}; SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof window === 'undefined') return;
  document.cookie = 'session_user=; path=/; max-age=0; SameSite=Lax';
}
