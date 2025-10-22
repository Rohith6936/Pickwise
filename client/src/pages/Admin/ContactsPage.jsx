// ✅ finalworking/p6/client/src/pages/Admin/ContactsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminContacts,
  replyToContact,
  updateContactStatus,
} from "../../api";
import "../../styles/AdminFeedback.css";

export default function ContactsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch contacts on load
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminContacts();
        const normalized = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setItems(
          normalized.map((d) => ({
            id: d._id || d.id,
            name: d.name || "",
            email: d.email || "",
            message: d.message || "",
            status: d.status || "open",
            replyMessage: d.replyMessage || "",
            repliedAt: d.repliedAt || null,
            createdAt: d.createdAt || null,
          }))
        );
      } catch (e) {
        console.error("❌ Failed to fetch contacts:", e);
        setError("Failed to load contact messages.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ✅ Search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const text = `${it.name || ""} ${it.email || ""} ${it.status || ""} ${
        it.message || ""
      }`.toLowerCase();
      return text.includes(q);
    });
  }, [items, query]);

  // ✅ Modal controls
  const openModal = (it) => {
    setSelected(it);
    setReply("");
  };
  const closeModal = () => {
    setSelected(null);
    setReply("");
  };

  // ✅ Send reply
  async function onSendReply() {
    if (!selected?.id || !reply.trim()) return;
    setUpdating(true);
    try {
      await replyToContact(selected.id, reply.trim());
      setItems((prev) =>
        prev.map((it) =>
          it.id === selected.id
            ? {
                ...it,
                replyMessage: reply.trim(),
                status: "replied",
                repliedAt: new Date().toISOString(),
              }
            : it
        )
      );
      setReply("");
    } catch (e) {
      alert("Failed to send reply");
    } finally {
      setUpdating(false);
    }
  }

  // ✅ Update status
  async function onChangeStatus(e) {
    const status = e.target.value;
    if (!selected?.id) return;
    setUpdating(true);
    try {
      await updateContactStatus(selected.id, status);
      setItems((prev) =>
        prev.map((it) => (it.id === selected.id ? { ...it, status } : it))
      );
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading)
    return <p style={{ color: "white", padding: "1rem" }}>⏳ Loading contacts...</p>;

  return (
    <div className="feedback-admin-page">
      <div className="page-header">
        <button onClick={() => navigate("/admin")} className="analytics-back">
          ← Back to Admin Dashboard
        </button>
        <h2 className="page-title">📨 Contact Messages</h2>
      </div>

      {error && <p className="page-error">{error}</p>}

      {/* 🔍 Search Bar */}
      <div className="controls">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name, email, status, message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 🗒️ Contacts Table */}
      <div className="table-container">
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr
                key={it.id}
                onClick={() => openModal(it)}
                className="row-hover"
              >
                <td>{it.name || "—"}</td>
                <td>{it.email || "—"}</td>
                <td className="comment-cell">
                  {it.message ? (
                    <span title={it.message}>{it.message}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <span className="badge badge-neutral">{it.status}</span>
                </td>
                <td>
                  {it.createdAt
                    ? new Date(it.createdAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No contact messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 💬 Modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Details</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="label">From</span>
                <span className="value">
                  {selected.name || "—"}{" "}
                  {selected.email ? `(${selected.email})` : ""}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Message</span>
                <span className="value wrap">
                  {selected.message || <span className="muted">—</span>}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Status</span>
                <span className="value">
                  <select
                    value={selected.status}
                    onChange={onChangeStatus}
                    disabled={updating}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="replied">replied</option>
                    <option value="archived">archived</option>
                  </select>
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Send Reply</span>
                <span className="value wrap">
                  <textarea
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply to the user"
                    style={{ width: "100%" }}
                  />
                  <button
                    onClick={onSendReply}
                    disabled={updating || !reply.trim()}
                    style={{ marginTop: 8 }}
                  >
                    {updating ? "Sending..." : "Send Reply"}
                  </button>
                </span>
              </div>

              {selected.replyMessage && (
                <div className="detail-row">
                  <span className="label">Last Reply</span>
                  <span className="value wrap">{selected.replyMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
