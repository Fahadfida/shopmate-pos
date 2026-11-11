import React, { useState, useEffect } from "react";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function MasterLedger({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [filterStream, setFilterStream] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadMasterLedger = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke("get-master-general-ledger");
      setEntries(data || []);
    }
  };

  useEffect(() => {
    loadMasterLedger();
  }, []);

  // Filter logic across streams, search queries, and date ranges
  const filteredEntries = entries.filter((entry) => {
    const matchesStream =
      filterStream === "ALL" || entry.stream === filterStream;
    const matchesSearch =
      (entry.entity_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (entry.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (entry.user_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    const entryDate = entry.date ? entry.date.substring(0, 10) : "";
    if (startDate && entryDate < startDate) matchesDate = false;
    if (endDate && entryDate > endDate) matchesDate = false;

    return matchesStream && matchesSearch && matchesDate;
  });

  // Calculate aggregate financial totals
  const totalDebits = filteredEntries.reduce(
    (sum, e) => sum + (e.debit || 0),
    0,
  );
  const totalCredits = filteredEntries.reduce(
    (sum, e) => sum + (e.credit || 0),
    0,
  );
  const netBalance = totalCredits - totalDebits;

  // Stream counts for filter pills
  const countSales = entries.filter((e) => e.stream === "SALE").length;
  const countExpenses = entries.filter((e) => e.stream === "EXPENSE").length;
  const countKhata = entries.filter(
    (e) => e.stream === "CUSTOMER_KHATA",
  ).length;
  const countShrinkage = entries.filter((e) => e.stream === "SHRINKAGE").length;
  const countAudit = entries.filter((e) => e.stream === "AUDIT_LOG").length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "calc(100vh - 90px)",
        overflow: "hidden",
      }}
    >
      {/* HEADER & OPERATOR CONTEXT */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.05rem" }}>
            Master General Ledger & Audit
          </h3>
          <p
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              margin: "2px 0 0 0",
            }}
          >
            A consolidated chronological audit feed tracking sales revenue,
            operating expenses, customer khata, inventory write-offs, and
            security logs.
          </p>
        </div>
        <button
          className="btn"
          style={{
            fontSize: "0.72rem",
            padding: "6px 12px",
            background: "#f1f5f9",
            border: "1px solid #cbd5e0",
          }}
          onClick={loadMasterLedger}
        >
          🔄 Refresh Master Feed
        </button>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            // borderLeft: "4px solid #ef4444",
            background: "linear-gradient(135deg, #0284c7 0%, #0d5c75 100%)",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#f9fbfe",
              fontWeight: "bold",
            }}
          >
            TOTAL DEBITS (OUTFLOWS / COSTS)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#fffefe",
              marginTop: "2px",
            }}
          >
            Rs.{" "}
            {totalDebits.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 14px",
            background: "#fff",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #95f098 0%, #35b910 100%)",
            // borderLeft: "4px solid #10b981",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#fafcff",
              fontWeight: "bold",
            }}
          >
            TOTAL CREDITS (INFLOWS / REVENUE)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#f8fefc",
              marginTop: "2px",
            }}
          >
            Rs.{" "}
            {totalCredits.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 14px",
            background: "#fff",
            borderRadius: "8px",
            // borderLeft: "4px solid #0d5c75",
            background: "linear-gradient(135deg, #f0e595 0%, #b9a810 100%)",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#fbfcfe",
              fontWeight: "bold",
            }}
          >
            NET LEDGER POSITION
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#fbfeff",
              marginTop: "2px",
            }}
          >
            Rs.{" "}
            {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
        className="card"
        style={{
          background: "#f8fafc",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* STREAM PILLS */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All Streams (${entries.length})` },
            { id: "SALE", label: `Sales (${countSales})` },
            { id: "EXPENSE", label: `Expenses (${countExpenses})` },
            { id: "CUSTOMER_KHATA", label: `Khata (${countKhata})` },
            { id: "SHRINKAGE", label: `Shrinkage (${countShrinkage})` },
            { id: "AUDIT_LOG", label: `Security Logs (${countAudit})` },
          ].map((pill) => (
            <button
              key={pill.id}
              className="btn"
              style={{
                fontSize: "0.7rem",
                padding: "5px 10px",
                border: "none",
                borderRadius: "6px",
                fontWeight: filterStream === pill.id ? "bold" : "normal",
                background: filterStream === pill.id ? "#0d5c75" : "#fff",
                color: filterStream === pill.id ? "#fff" : "#334155",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              onClick={() => setFilterStream(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* DATE & SEARCH FILTERS */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#fff",
              padding: "3px 6px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}
          >
            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: "none",
                fontSize: "0.7rem",
                background: "transparent",
              }}
            />
            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: "none",
                fontSize: "0.7rem",
                background: "transparent",
              }}
            />
          </div>

          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search entity, note, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              margin: 0,
              padding: "5px 10px",
              fontSize: "0.75rem",
              width: "200px",
            }}
          />

          {(startDate || endDate || searchQuery || filterStream !== "ALL") && (
            <button
              className="btn"
              style={{
                fontSize: "0.7rem",
                padding: "5px 8px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "none",
                fontWeight: "bold",
              }}
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
                setFilterStream("ALL");
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div
        className="card"
        style={{
          flex: 1,
          background: "#fff",
          padding: "14px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.1fr 1.3fr 2fr 1fr 1fr 1fr 0.9fr",
            fontSize: "0.7rem",
            fontWeight: "bold",
            background: "#034280",
            padding: "8px",
            borderRadius: "4px",
            borderBottom: "1px solid #cbd5e0",
          }}
        >
          <span>TIMESTAMP</span>
          <span>STREAM TYPE</span>
          <span>ENTITY / PARTY</span>
          <span>DESCRIPTION / DETAILS</span>
          <span style={{ textAlign: "right" }}>DEBIT (OUT)</span>
          <span style={{ textAlign: "right" }}>CREDIT (IN)</span>
          <span style={{ textAlign: "right" }}>BALANCE</span>
          <span style={{ textAlign: "center" }}>OPERATOR</span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {filteredEntries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                padding: "50px 0",
              }}
            >
              <h4>
                No master general ledger transactions found matching your
                criteria.
              </h4>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              let badgeBg = "#e2e8f0";
              let badgeColor = "#334155";
              let streamLabel = entry.stream;

              if (entry.stream === "SALE") {
                badgeBg = "#d1fae5";
                badgeColor = "#065f46";
                streamLabel = "Sales Revenue";
              } else if (entry.stream === "EXPENSE") {
                badgeBg = "#fee2e2";
                badgeColor = "#991b1b";
                streamLabel = "Operating Expense";
              } else if (entry.stream === "CUSTOMER_KHATA") {
                badgeBg = "#e0f2fe";
                badgeColor = "#0369a1";
                streamLabel = "Customer Khata";
              } else if (entry.stream === "SHRINKAGE") {
                badgeBg = "#fef3c7";
                badgeColor = "#d97706";
                streamLabel = "Inventory Write-Off";
              } else if (entry.stream === "AUDIT_LOG") {
                badgeBg = "#f3e8ff";
                badgeColor = "#6b21a8";
                streamLabel = "Security Audit";
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.2fr 1.1fr 1.3fr 2fr 1fr 1fr 1fr 0.9fr",
                    fontSize: "0.74rem",
                    alignItems: "center",
                    background: "#fff",
                    padding: "7px 8px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {entry.date}
                  </span>
                  <div>
                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      {streamLabel}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {entry.entity_name || "General"}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {entry.description}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      color: entry.debit > 0 ? "#ef4444" : "#94a3b8",
                    }}
                  >
                    {entry.debit > 0
                      ? `Rs. ${entry.debit.toLocaleString()}`
                      : "—"}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      color: entry.credit > 0 ? "#10b981" : "#94a3b8",
                    }}
                  >
                    {entry.credit > 0
                      ? `Rs. ${entry.credit.toLocaleString()}`
                      : "—"}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#0d5c75",
                    }}
                  >
                    {entry.balance_after
                      ? `Rs. ${entry.balance_after.toLocaleString()}`
                      : "—"}
                  </span>
                  <span
                    style={{
                      textAlign: "center",
                      fontSize: "0.68rem",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    {entry.user_name || "Manager"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER METRICS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "8px",
            marginTop: "8px",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          <span>
            Showing {filteredEntries.length} of {entries.length} audit feed
            entries
          </span>
          <div style={{ display: "flex", gap: "15px", fontWeight: "bold" }}>
            <span style={{ color: "#ef4444" }}>
              Outflows: Rs. {totalDebits.toLocaleString()}
            </span>
            <span style={{ color: "#10b981" }}>
              Inflows: Rs. {totalCredits.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
