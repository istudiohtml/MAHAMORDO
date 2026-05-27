"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/components/cms/CmsProvider";

type LogType = "credit" | "session";

interface CreditLog {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  user?: { email?: string; name?: string | null };
}

interface SessionLog {
  id: string;
  status: string;
  createdAt: string;
  user?: { email?: string; name?: string | null };
  oracle?: { name?: string };
  _count?: { messages?: number };
}

type AnyLog = CreditLog | SessionLog;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  if (status === "ACTIVE") return "cms-status-active";
  if (status === "COMPLETED") return "cms-status-completed";
  return "cms-status-failed";
}

export default function LogsPage() {
  const [type, setType] = useState<LogType>("credit");
  const [data, setData] = useState<AnyLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cmsFetch(`/api/cms/logs?type=${type}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="cms-page cms-logs-page">
      <header className="cms-page-header">
        <div>
          <p className="cms-page-eyebrow">Logs</p>
          <h1 className="cms-page-title">บันทึกการใช้งาน</h1>
          <p className="cms-page-sub">
            รวม {total} รายการ — credit logs และ session history
          </p>
        </div>
        <div className="cms-logs-header-actions">
          <div className="cms-segmented" role="tablist">
            {(["credit", "session"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={type === t}
                onClick={() => setType(t)}
                className={`cms-segmented-item${type === t ? " is-active" : ""}`}
              >
                {t === "credit" ? "Credit Logs" : "Sessions"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading && (
        <div className="cms-table-wrap" aria-busy="true">
          <div style={{ padding: "1rem" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton cms-skel-row" />
            ))}
          </div>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="cms-empty">
          <span className="cms-empty-icon">≡</span>
          <h3>ยังไม่มีข้อมูล</h3>
          <p>
            {type === "credit"
              ? "ยังไม่มีการใช้งานเครดิต"
              : "ยังไม่มี session การคุยกับหมอดู"}
          </p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              {type === "credit" ? (
                <tr>
                  <th>ผู้ใช้</th>
                  <th>จำนวน</th>
                  <th>เหตุผล</th>
                  <th>วันที่</th>
                </tr>
              ) : (
                <tr>
                  <th>ผู้ใช้</th>
                  <th>หมอดู</th>
                  <th>ข้อความ</th>
                  <th>สถานะ</th>
                  <th>วันที่</th>
                </tr>
              )}
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="cms-cell-primary">
                      {item.user?.name || "—"}
                    </p>
                    <p className="cms-cell-sub">{item.user?.email ?? ""}</p>
                  </td>
                  {type === "credit" ? (
                    <>
                      <td>
                        <span
                          className={
                            (item as CreditLog).amount > 0
                              ? "cms-amount-pos"
                              : "cms-amount-neg"
                          }
                        >
                          {(item as CreditLog).amount > 0
                            ? `+${(item as CreditLog).amount}`
                            : (item as CreditLog).amount}
                        </span>
                      </td>
                      <td>
                        <span className="cms-cell-mono">
                          {(item as CreditLog).reason}
                        </span>
                      </td>
                      <td>
                        <span className="cms-cell-muted">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <span className="cms-cell-primary" style={{ fontWeight: 500 }}>
                          {(item as SessionLog).oracle?.name ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className="cms-cell-muted">
                          {(item as SessionLog)._count?.messages ?? 0} ข้อความ
                        </span>
                      </td>
                      <td>
                        <span
                          className={`cms-status-badge ${statusClass((item as SessionLog).status)}`}
                        >
                          {(item as SessionLog).status}
                        </span>
                      </td>
                      <td>
                        <span className="cms-cell-muted">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
