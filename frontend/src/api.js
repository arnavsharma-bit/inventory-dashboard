const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }
  return data;
}

export const getInventory = () => request("/inventory");

export const addInventoryItem = (item) =>
  request("/inventory", {
    method: "POST",
    body: JSON.stringify(item),
  });

export const updateInventoryItem = (id, item) =>
  request(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });

export const deleteInventoryItem = (id) =>
  request(`/inventory/${id}`, { method: "DELETE" });
