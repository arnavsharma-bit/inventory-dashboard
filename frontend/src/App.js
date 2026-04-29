import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "./api";

const STATIC_INVENTORY = [
  { id: 1, name: "Arduino Kit",    category: "Hardware",    quantity: 5,  status: "Available"   },
  { id: 2, name: "Figma License",  category: "Software",    quantity: 20, status: "Available"   },
  { id: 3, name: "USB-C Cable",    category: "Accessories", quantity: 0,  status: "Unavailable" },
  { id: 4, name: "Monitor 4K",     category: "Hardware",    quantity: 3,  status: "Available"   },
  { id: 5, name: "Notion License", category: "Software",    quantity: 15, status: "Available"   },
];

const CATEGORIES = ["Hardware", "Software", "Accessories", "Electronics", "Furniture", "Other"];
const STATUSES   = ["Available", "Unavailable", "Low Stock"];
const EMPTY_FORM = { name: "", category: "", quantity: "", status: "Available" };

function StatusBadge({ status }) {
  const map = {
    "Available":   "badge badge-green",
    "Low Stock":   "badge badge-amber",
    "Unavailable": "badge badge-red",
  };
  return <span className={map[status] || "badge badge-red"}>{status}</span>;
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ "--c": color }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ItemModal({ initial, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category || form.quantity === "" || !form.status) {
      setError("All fields are required.");
      return;
    }
    setError("");
    onSave({ ...form, quantity: parseInt(form.quantity) });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial ? "EDIT ITEM" : "ADD ITEM"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="form-error">{error}</p>}
          <label className="form-label">
            Name
            <input className="form-input" value={form.name} onChange={set("name")} placeholder="e.g. Arduino Kit" required />
          </label>
          <label className="form-label">
            Category
            <select className="form-input" value={form.category} onChange={set("category")} required>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="form-label">
            Quantity
            <input className="form-input" type="number" min="0" value={form.quantity} onChange={set("quantity")} placeholder="0" required />
          </label>
          <label className="form-label">
            Status
            <select className="form-input" value={form.status} onChange={set("status")} required>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={isSaving}>
              {isSaving ? "Saving…" : initial ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [backendOk, setBackendOk] = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [adding,    setAdding]    = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [toast,     setToast]     = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setItems(Array.isArray(data) ? data : data.data || []);
      setBackendOk(true);
    } catch {
      setItems(STATIC_INVENTORY);
      setBackendOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdd(form) {
    setSaving(true);
    try {
      await addInventoryItem(form);
      await fetchItems();
      setAdding(false);
      showToast(`"${form.name}" added successfully`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    setSaving(true);
    try {
      await updateInventoryItem(editing.id, form);
      await fetchItems();
      setEditing(null);
      showToast(`"${form.name}" updated`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteInventoryItem(item.id);
      await fetchItems();
      showToast(`"${item.name}" deleted`, "error");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const categories = ["All", ...new Set(items.map((i) => i.category))];
  const visible = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) &&
      (catFilter === "All" || i.category === catFilter)
    );
  });

  return (
    <div className="app">
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.msg}
        </div>
      )}

      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <span className="logo-mark">▣</span>
            <span className="logo-text">INVENTORY</span>
          </div>
          <span className="header-sub">Management Dashboard</span>
        </div>
        <div className="header-right">
          {!backendOk && <span className="offline-badge">⚡ Offline Mode</span>}
          <button className="btn btn-accent" onClick={() => setAdding(true)}>+ Add Item</button>
        </div>
      </header>

      <main className="main">
        <section className="stats-row">
          <StatCard label="Total Items"  value={items.length} color="var(--accent)" />
          <StatCard label="Available"    value={items.filter((i) => i.status === "Available").length}   color="var(--green)"  />
          <StatCard label="Unavailable"  value={items.filter((i) => i.status === "Unavailable").length} color="var(--red)"    />
          <StatCard label="Low Stock"    value={items.filter((i) => i.status === "Low Stock").length}    color="var(--amber)"  />
        </section>

        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cat-filters">
            {categories.map((c) => (
              <button
                key={c}
                className={`cat-tab ${catFilter === c ? "active" : ""}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="state-box">
            <span className="state-spinner" />
            <p>Loading inventory…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="state-box"><p>No items match your search.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="inv-row">
                    <td className="col-id">{item.id}</td>
                    <td className="col-name">{item.name}</td>
                    <td><span className="cat-pill">{item.category}</span></td>
                    <td className={item.quantity === 0 ? "qty-zero" : ""}>{item.quantity}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="col-actions">
                      <button className="action-btn" onClick={() => setEditing(item)}>Edit</button>
                      <button className="action-btn action-btn-del" onClick={() => handleDelete(item)}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="table-footer">
          Showing {visible.length} of {items.length} items
          {!backendOk && " · Showing sample data (backend offline)"}
        </p>
      </main>

      {adding  && <ItemModal onSave={handleAdd}  onClose={() => setAdding(false)} isSaving={saving} />}
      {editing && <ItemModal initial={editing} onSave={handleEdit} onClose={() => setEditing(null)} isSaving={saving} />}
    </div>
  );
}
