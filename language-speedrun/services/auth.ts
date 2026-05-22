export interface User {
  username: string;
  isGuest: boolean;
  passwordHash?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const USERS_KEY = 'language-sprint-users';
const CURRENT_AUTH_KEY = 'language-sprint-auth';
const GUEST_PREFIX = 'Guest_';

// Simple hash function for password storage (NOT production-grade)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(username: string, password: string): { success: boolean; error?: string } {
  const users = getAllUsers();

  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Username already exists' };
  }

  // Validate username
  if (username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters' };
  }

  if (username.startsWith(GUEST_PREFIX)) {
    return { success: false, error: 'Username cannot start with "Guest_"' };
  }

  // Validate password
  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters' };
  }

  const newUser: User = {
    username,
    isGuest: false,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  return { success: true };
}

export function loginUser(username: string, password: string): { success: boolean; error?: string } {
  const users = getAllUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.isGuest) {
    return { success: false, error: 'Cannot login to guest account' };
  }

  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password' };
  }

  setCurrentUser(user);
  return { success: true };
}

export async function createGuestUser(tempUsername: string): Promise<{ success: boolean; error?: string }> {
  if (!tempUsername || tempUsername.trim().length === 0) {
    return { success: false, error: 'Username cannot be empty' };
  }

  const username = tempUsername.trim();

  try {
    // Sign the online guestbook
    const response = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sign',
        data: { username }
      })
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to sign guestbook' };
    }

    // Also save locally for offline access
    const guestUser: User = {
      username,
      isGuest: true,
      createdAt: new Date().toISOString()
    };

    const users = getAllUsers();
    const existingIndex = users.findIndex(u => u.username === username);
    if (existingIndex >= 0) {
      users[existingIndex] = guestUser;
    } else {
      users.push(guestUser);
    }
    saveUsers(users);
    setCurrentUser(guestUser);

    return { success: true };
  } catch {
    // Fallback to local-only if API fails
    const guestUser: User = {
      username,
      isGuest: true,
      createdAt: new Date().toISOString()
    };

    const users = getAllUsers();
    users.push(guestUser);
    saveUsers(users);
    setCurrentUser(guestUser);

    return { success: true };
  }
}

export function getCurrentAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  const stored = localStorage.getItem(CURRENT_AUTH_KEY);
  if (!stored) {
    return { user: null, isAuthenticated: false };
  }

  const user: User = JSON.parse(stored);
  return { user, isAuthenticated: true };
}

function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_AUTH_KEY, JSON.stringify(user));
}

export function logout(): void {
  if (typeof window === 'undefined') return;

  const auth = getCurrentAuth();

  // If guest user, remove from users list
  if (auth.user?.isGuest) {
    const users = getAllUsers();
    const filteredUsers = users.filter(u => u.username !== auth.user?.username);
    saveUsers(filteredUsers);
  }

  localStorage.removeItem(CURRENT_AUTH_KEY);
}

export function isLoggedIn(): boolean {
  return getCurrentAuth().isAuthenticated;
}

export function getCurrentUsername(): string {
  const auth = getCurrentAuth();
  return auth.user?.username || 'Anonymous';
}
