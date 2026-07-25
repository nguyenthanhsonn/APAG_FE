export function hasAccessToken() {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('accessToken');
  return Boolean(token);
}
