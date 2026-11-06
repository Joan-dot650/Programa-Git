// El token vive solo en memoria. Recargar la página exige iniciar sesión otra vez.
export const session = { token: null, user: null };
export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401 && session.token) {
      session.token = null; session.user = null;
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new Error([data.mensaje, ...Object.values(data.errores ?? {})].join(' '));
  }
  return data;
}
