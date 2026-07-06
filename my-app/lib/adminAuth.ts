export const AUTH_COOKIE_NAME = 'safemaemoh_session';

export type UserRole = 'user' | 'admin';

export interface AppAccount {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export function getAccounts() {
  if (!process.env.AUTH_ACCOUNTS) {
    throw new Error('Missing AUTH_ACCOUNTS');
  }

  try {
    const accounts = JSON.parse(process.env.AUTH_ACCOUNTS) as AppAccount[];
    if (accounts.length === 0) {
      throw new Error('AUTH_ACCOUNTS must contain at least one account');
    }
    return accounts;
  } catch {
    throw new Error('Invalid AUTH_ACCOUNTS JSON');
  }
}

function getSessionSecret() {
  if (!process.env.AUTH_SESSION_SECRET) {
    throw new Error('Missing AUTH_SESSION_SECRET');
  }

  return process.env.AUTH_SESSION_SECRET;
}

export function authenticate(username: string, password: string, role?: UserRole) {
  const account = getAccounts().find(
    (item) => item.username === username && item.password === password && (!role || item.role === role)
  );

  if (!account) return null;

  return {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
  };
}

export function createSessionValue(account: Pick<AppAccount, 'username' | 'role' | 'displayName'>) {
  return encodeURIComponent(`${account.username}|${account.role}|${account.displayName}|${getSessionSecret()}`);
}

export function parseSessionValue(value: string | undefined) {
  if (!value) return null;

  let username = '';
  let role = '';
  let displayName = '';
  let secret = '';

  try {
    [username, role, displayName, secret] = decodeURIComponent(value).split('|');
  } catch {
    return null;
  }

  if (secret !== getSessionSecret() || (role !== 'user' && role !== 'admin')) {
    return null;
  }

  return {
    username,
    role,
    displayName,
  };
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name) continue;
    cookies.set(name, decodeURIComponent(valueParts.join('=')));
  }

  return cookies;
}

export function isAdminRequest(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  return parseSessionValue(cookies.get(AUTH_COOKIE_NAME))?.role === 'admin';
}

export function getSessionFromRequest(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  return parseSessionValue(cookies.get(AUTH_COOKIE_NAME));
}
