const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const getErrorMessage = async (response) => {
  try {
    const json = await response.json();
    if (json?.message && json?.error) {
      return `${json.message} (${json.error})`;
    }
    return json?.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

export const apiRequest = async (path, options = {}, token = "") => {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};

export const fetchProducts = async ({ limit, view = "list", signal } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (view && view !== "list") params.set("view", view);
  const query = params.toString() ? `?${params.toString()}` : "";
  const json = await apiRequest(`/products${query}`, { signal });
  return Array.isArray(json?.products) ? json.products : [];
};

export const fetchProductById = async (id, { signal } = {}) => {
  const json = await apiRequest(`/products/${encodeURIComponent(id)}`, { signal });
  return json?.product || null;
};

export { API_BASE };
