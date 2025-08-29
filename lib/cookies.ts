export const removeAuthToken = async () => {
  await fetch('/api/auth/token', { method: 'DELETE' });
};
