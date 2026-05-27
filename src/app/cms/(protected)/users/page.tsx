"use client";

import { useEffect, useMemo, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

type Role = "USER" | "ADMIN" | "SUPERADMIN";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  credits: number;
  createdAt: string;
  provider: string;
  deletionRequestedAt: string | null;
}

const ROLE_OPTIONS: Role[] = ["USER", "ADMIN", "SUPERADMIN"];

function formatJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isAnonymised(user: User) {
  return user.provider === "deleted";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "anonymised">("all");

  useEffect(() => {
    cmsFetch("/api/cms/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUsers(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleUsers = useMemo(() => {
    if (filter === "pending") {
      return users.filter(
        (u) => u.deletionRequestedAt && !isAnonymised(u)
      );
    }
    if (filter === "anonymised") {
      return users.filter(isAnonymised);
    }
    return users;
  }, [users, filter]);

  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role !== "USER").length;
    const totalCredits = users.reduce((sum, u) => sum + (u.credits ?? 0), 0);
    const pendingDeletion = users.filter(
      (u) => u.deletionRequestedAt && !isAnonymised(u)
    ).length;
    return {
      total: users.length,
      adminCount,
      totalCredits,
      pendingDeletion,
    };
  }, [users]);

  async function changeRole(id: string, role: string) {
    const res = await cmsFetch(`/api/cms/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: data.role } : u))
      );
    }
  }

  async function deleteUser(id: string, hard = false) {
    const msg = hard
      ? "ลบถาวร (จะลบทั้งแถวออกจาก DB — ถ้ามีประวัติชำระเงินจะ anonymise แทน)"
      : "ลบบัญชีนี้ตาม PDPA (จะลบข้อมูลส่วนตัวออกแต่เก็บประวัติชำระเงิน 5 ปีตามกฎหมาย)";
    if (!confirm(`${msg} — ดำเนินการต่อ?`)) return;
    setDeletingId(id);
    const res = await cmsFetch(
      `/api/cms/users/${id}${hard ? "?hard=1" : ""}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.mode === "hard") {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        // anonymised — refresh from server so the row shows new tombstone email.
        const refreshed = await cmsFetch("/api/cms/users").then((r) => r.json());
        if (Array.isArray(refreshed)) setUsers(refreshed);
        if (data.note) alert(data.note);
      }
    }
    setDeletingId(null);
  }

  return (
    <div className="cms-page cms-users-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Users</p>
          <h1 className="cms-page-title">ผู้ใช้</h1>
          <p className="cms-page-sub">
            จัดการ role และเครดิต — SUPERADMIN เท่านั้น
          </p>
        </div>
      </header>

      {!loading && users.length > 0 && (
        <>
          <div className="cms-posts-stats">
            <div className="cms-posts-stat">
              <span className="cms-posts-stat-value">{stats.total}</span>
              <span className="cms-posts-stat-label">ผู้ใช้ทั้งหมด</span>
            </div>
            <div className="cms-posts-stat">
              <span className="cms-posts-stat-value">{stats.adminCount}</span>
              <span className="cms-posts-stat-label">ทีมงาน</span>
            </div>
            <div className="cms-posts-stat">
              <span className="cms-posts-stat-value">{stats.totalCredits}</span>
              <span className="cms-posts-stat-label">เครดิตรวม</span>
            </div>
            {stats.pendingDeletion > 0 && (
              <div className="cms-posts-stat cms-posts-stat-warning">
                <span className="cms-posts-stat-value">
                  {stats.pendingDeletion}
                </span>
                <span className="cms-posts-stat-label">
                  ขอลบบัญชี (PDPA)
                </span>
              </div>
            )}
          </div>

          <div className="cms-users-filters">
            <button
              type="button"
              className={`cms-users-filter${filter === "all" ? " is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด ({stats.total})
            </button>
            <button
              type="button"
              className={`cms-users-filter${filter === "pending" ? " is-active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              ขอลบบัญชี ({stats.pendingDeletion})
            </button>
            <button
              type="button"
              className={`cms-users-filter${filter === "anonymised" ? " is-active" : ""}`}
              onClick={() => setFilter("anonymised")}
            >
              ลบแล้ว (anonymised)
            </button>
          </div>
        </>
      )}

      {error && <p className="cms-error">{error}</p>}

      {loading && (
        <div className="cms-table-wrap" aria-busy="true">
          <div style={{ padding: "1rem" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton cms-skel-row" />
            ))}
          </div>
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="cms-empty">
          <span className="cms-empty-icon cms-empty-icon-emerald">◎</span>
          <h3>ยังไม่มีผู้ใช้</h3>
          <p>ผู้ใช้จะปรากฏที่นี่หลังจากสมัครเข้าใช้งาน</p>
        </div>
      )}

      {!loading && visibleUsers.length > 0 && (
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>Role</th>
                <th>เครดิต</th>
                <th>สมัครเมื่อ</th>
                <th>สถานะ</th>
                <th className="cms-table-actions"></th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const deleted = isAnonymised(user);
                const pending = !!user.deletionRequestedAt && !deleted;
                return (
                  <tr
                    key={user.id}
                    className={
                      deleted
                        ? "cms-row-muted"
                        : pending
                          ? "cms-row-warning"
                          : ""
                    }
                  >
                    <td>
                      <p className="cms-cell-primary">
                        {deleted ? "— (ลบแล้ว)" : user.name || "—"}
                      </p>
                      <p className="cms-cell-sub">{user.email}</p>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className={`cms-role-select cms-role-${user.role}`}
                        disabled={deleted}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="cms-cell-mono">{user.credits}</span>
                    </td>
                    <td>
                      <span className="cms-cell-muted">
                        {formatJoinDate(user.createdAt)}
                      </span>
                    </td>
                    <td>
                      {deleted ? (
                        <span className="cms-status-pill cms-status-deleted">
                          ลบแล้ว
                        </span>
                      ) : pending ? (
                        <span
                          className="cms-status-pill cms-status-pending"
                          title={`ขอลบเมื่อ ${formatJoinDate(user.deletionRequestedAt!)}`}
                        >
                          ขอลบบัญชี
                        </span>
                      ) : (
                        <span className="cms-status-pill cms-status-ok">
                          ใช้งานอยู่
                        </span>
                      )}
                    </td>
                    <td className="cms-table-actions">
                      {!deleted && (
                        <>
                          <button
                            type="button"
                            onClick={() => deleteUser(user.id, false)}
                            className="cms-btn-danger-ghost"
                            disabled={deletingId === user.id}
                            title="ลบตาม PDPA — เก็บประวัติชำระเงิน 5 ปี"
                          >
                            {deletingId === user.id ? "..." : "ลบ (PDPA)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(user.id, true)}
                            className="cms-btn-danger-ghost"
                            disabled={deletingId === user.id}
                            title="ลบถาวร — ใช้ได้เฉพาะ user ที่ไม่มีประวัติชำระเงิน"
                          >
                            ✕ ลบถาวร
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && visibleUsers.length === 0 && users.length > 0 && (
        <div className="cms-empty">
          <p>ไม่มี user ในหมวดนี้</p>
        </div>
      )}
    </div>
  );
}
