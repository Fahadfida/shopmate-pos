import React, { useState, useEffect } from "react";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function FinancialLedger({ currentUser }) {
  const [ledgerData, setLedgerData] = useState({
    expenses: [],
    purchases: [],
    sales: [],
    refunds: [],
    summary: {
      totalSales: 0,
      totalExpenses: 0,
      totalPurchases: 0,
      totalRefunds: 0,
      netProfit: 0,
    },
  });
  const [totalSupplierPayables, setTotalSupplierPayables] = useState(0);
  const [activeTab, setActiveTab] = useState("SALES");
  const [users, setUsers] = useState([]);

  // Filter States (Clean From & To date pickers only)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "Rent",
    amount: "",
    description: "",
  });

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    total_amount: "",
    payment_type: "CASH",
    category: "",
    amount: "",
    description: "",
    qty_received: "",
    unit_cost: "",
    qty: "",
    amount_refunded: "",
  });

  const loadFinancials = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke("get-financial-ledger", {
        startDate,
        endDate,
        user_id: selectedUser ? parseInt(selectedUser) : null,
        payment_type: paymentType,
        sortBy,
      });
      const fetchedUsers = await ipc.invoke("get-users");
      const suppliers = await ipc.invoke("get-suppliers", true);

      const payablesSum = (suppliers || []).reduce(
        (acc, s) => acc + (s.balance > 0 ? s.balance : 0),
        0,
      );

      setLedgerData(
        data || {
          expenses: [],
          purchases: [],
          sales: [],
          refunds: [],
          summary: {},
        },
      );
      setUsers(fetchedUsers || []);
      setTotalSupplierPayables(payablesSum);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [startDate, endDate, selectedUser, paymentType, sortBy]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedUser("");
    setPaymentType("");
    setSortBy("date_desc");
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(expenseForm.amount);
    if (!amt || amt <= 0) return alert("Enter a valid expense amount.");

    if (ipc) {
      const res = await ipc.invoke("add-expense", {
        expense: expenseForm,
        currentUser,
      });
      if (res.success) {
        setIsExpenseModalOpen(false);
        setExpenseForm({ category: "Rent", amount: "", description: "" });
        loadFinancials();
      } else {
        alert("Error recording expense: " + res.error);
      }
    }
  };

  // 🛡️ ADMIN-ONLY RECORD DELETION GUARD ACROSS ALL TABS
  const handleDeleteRecord = async (id, type) => {
    if (currentUser?.role?.toUpperCase() !== "ADMIN") {
      return alert(
        "Access Denied: Only Manager (Admin) profiles can delete financial records.",
      );
    }

    if (
      !window.confirm(
        `Are you sure you want to delete this ${type.toLowerCase()} record?`,
      )
    )
      return;

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("delete-ledger-entry", {
        type,
        id,
        currentUser,
      });
      if (res.success) {
        alert("🗑️ Record deleted successfully!");
        loadFinancials();
      } else {
        alert("Failed to delete record: " + res.error);
      }
    }
  };

  const openEditModal = (record, type) => {
    if (currentUser?.role?.toUpperCase() !== "ADMIN") {
      return alert(
        "Access Denied: Only Managers (Admin) can edit ledger records.",
      );
    }

    setEditingRecord({ ...record, type });
    setEditForm({
      total_amount: record.total_amount || record.invoice_total || "",
      payment_type: record.payment_type || "CASH",
      category: record.category || record.item_name || "",
      amount: record.amount || "",
      description: record.description || record.invoice_no || "",
      qty_received: record.qty_received || "",
      unit_cost: record.unit_cost || "",
      qty: record.qty || "",
      amount_refunded: record.amount_refunded || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!ipc || !editingRecord) return;

    const res = await ipc.invoke("update-ledger-entry", {
      type: editingRecord.type,
      id: editingRecord.id || editingRecord.sale_id,
      data: editForm,
      currentUser,
    });

    if (res.success) {
      alert("✅ Ledger entry successfully updated!");
      setIsEditModalOpen(false);
      setEditingRecord(null);
      loadFinancials();
    } else {
      alert("❌ Update Failed: " + res.error);
    }
  };

  // 📄 PROFESSIONAL CORPORATE A4 PDF EXPORT GENERATOR
  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (ipc) {
      const rowsHtml =
        activeTab === "SALES"
          ? sales
              .map(
                (s) =>
                  `<tr><td>${s.date}</td><td>#INV-${s.sale_id}</td><td>${s.customer_name || "Walk-in"}</td><td>${s.payment_type}</td><td>${s.username || "—"}</td><td>${s.item_name || "—"}</td><td class="right">${s.qty_sold}</td><td class="right">Rs. ${s.unit_price?.toLocaleString()}</td><td class="right">Rs. ${s.total_line?.toLocaleString()}</td><td>Retail Sale Item</td></tr>`,
              )
              .join("")
          : activeTab === "REFUNDS"
            ? refunds
                .map(
                  (r) =>
                    `<tr><td>${r.date}</td><td>REF-${r.id}</td><td>${r.customer_name || "Walk-in"}</td><td>REFUND</td><td>${r.username || "—"}</td><td>${r.item_name || "—"}</td><td class="right">${r.qty}</td><td class="right">Rs. ${r.amount_refunded?.toLocaleString()}</td><td class="right">Rs. -${r.amount_refunded?.toLocaleString()}</td><td>Return: ${r.description || ""}</td></tr>`,
                )
                .join("")
            : activeTab === "EXPENSES"
              ? expenses
                  .map(
                    (e) =>
                      `<tr><td>${e.date}</td><td>EXP-${e.id}</td><td>Store Expense</td><td>CASH</td><td>${e.username || "—"}</td><td>Overhead</td><td class="right">1</td><td class="right">Rs. ${e.amount?.toLocaleString()}</td><td class="right">Rs. ${e.amount?.toLocaleString()}</td><td>${e.category}: ${e.description || "—"}</td></tr>`,
                  )
                  .join("")
              : purchases
                  .map(
                    (p) =>
                      `<tr><td>${p.date}</td><td>${p.invoice_no || "GRN"}</td><td>${p.supplier_name || "Direct Stock"}</td><td>${p.payment_type || "CREDIT"}</td><td>${p.username || "Manager"}</td><td>${p.item_name}</td><td class="right">${p.qty_received}</td><td class="right">Rs. ${p.unit_cost?.toLocaleString()}</td><td class="right">Rs. ${(p.qty_received * p.unit_cost)?.toLocaleString()}</td><td>Stock Purchase</td></tr>`,
                  )
                  .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Financial Ledger Report - ${activeTab}</title>
            <style>
              @page { size: A4 landscape; margin: 10mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #0f172a; background: #fff; margin: 0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d5c75; padding-bottom: 12px; margin-bottom: 18px; }
              .title-area h1 { margin: 0; color: #0d5c75; font-size: 18px; text-transform: uppercase; }
              .title-area p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
              td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
              .right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>Financial Ledger Statement (${activeTab})</h1>
                <p>ShopMate Enterprise Accounting Suite</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold; font-size: 12px;">Date: ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operator: ${currentUser?.username || "Manager"}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>InvoiceID</th>
                  <th>Customer/Supplier</th>
                  <th>PaymentType</th>
                  <th>Operator</th>
                  <th>Item Name</th>
                  <th class="right">Qty</th>
                  <th class="right">Amount</th>
                  <th class="right">Total</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const res = await ipc.invoke("export-ledger-pdf", html);
      if (res.success && !res.canceled) {
        alert(
          `✅ Financial statement successfully exported to PDF:\n${res.filePath}`,
        );
      } else if (!res.canceled) {
        alert("PDF Export failed: " + res.error);
      }
    }
  };

  const {
    summary,
    expenses = [],
    purchases = [],
    sales = [],
    refunds = [],
  } = ledgerData;

  // 11 Columns (Mode column removed)
  const unifiedGridTemplate =
    "1.1fr 0.8fr 1.2fr 0.8fr 0.7fr 1.2fr 0.5fr 0.8fr 0.8fr 1.3fr 0.9fr";

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
      {/* HEADER & OPERATOR ON DUTY BADGE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.05rem" }}>
            Ledger ( Profit & Loss )
          </h3>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#e0f2fe",
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "0.72rem",
              color: "#171818",
              fontWeight: "bold",
              border: "1px solid #bae6fd",
            }}
          >
            <span>👤 On Duty:</span>
            <span style={{ textTransform: "uppercase" }}>
              {currentUser?.username || "Manager"} (
              {currentUser?.role || "ADMIN"})
            </span>
          </div>

          <button
            className="btn btn-primary"
            style={{
              fontSize: "0.72rem",
              padding: "6px 12px",
              background: "#0d5c75",
              color: "#fff",
              fontWeight: "bold",
            }}
            onClick={handleExportA4PDF}
          >
            Export PDF Statement
          </button>
        </div>
      </div>

      {/* 5-COLUMN KPI SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "10px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "10px 12px",
            background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
            borderRadius: "8px",
            border: ".5px solid #bddde7",
            fontSize: "0.65rem",
            color: "#00183a",
            fontWeight: "bold",
          }}
        >
          <p>TOTAL RETAIL SALES</p>
          <div
            className="monospace"
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#00161c",
              marginTop: "2px",
            }}
          >
            Rs. {summary.totalSales?.toLocaleString()}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 12px",
            background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            borderRadius: "8px",
            border: ".5px solid #f0c0c0",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#222324",
              fontWeight: "bold",
            }}
          >
            OPERATING EXPENSES
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.15rem",
              fontWeight: "bold",
              color: "#141414",
              marginTop: "2px",
            }}
          >
            Rs. {summary.totalExpenses?.toLocaleString()}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 12px",
            background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
            borderRadius: "8px",
            border: ".5px solid #eccb91",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#012961",
              fontWeight: "bold",
            }}
          >
            TOTAL PURCHASES (GRN)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.15rem",
              fontWeight: "bold",
              color: "#012961",
              marginTop: "2px",
            }}
          >
            Rs. {summary.totalPurchases?.toLocaleString()}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 12px",
            background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
            borderRadius: "8px",
            border: ".5px solid #eebbbb",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#1a1b1b",
              fontWeight: "bold",
            }}
          >
            SUPPLIER PAYABLES (DEBT)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.15rem",
              fontWeight: "bold",
              color: "#1d1c1c",
              marginTop: "2px",
            }}
          >
            Rs. {totalSupplierPayables?.toLocaleString()}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 12px",
            background: "linear-gradient(135deg, #e7c76f 0%, #ffff3d 100%)",
            borderRadius: "8px",
            border: ".5px solid #a3ead2",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#09090a",
              fontWeight: "bold",
            }}
          >
            NET PROFIT / (LOSS)
          </div>
          <div
            className="monospace"
            style={{
              fontSize: "1.15rem",
              fontWeight: "bold",
              color: summary.netProfit >= 0 ? "#047857" : "#dc2626",
              marginTop: "2px",
            }}
          >
            Rs. {summary.netProfit?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
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
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#fff",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "bold",
                color: "#334155",
              }}
            >
              From:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: "none",
                fontSize: "0.72rem",
                background: "transparent",
              }}
            />
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "bold",
                color: "#334155",
              }}
            >
              To:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: "none",
                fontSize: "0.72rem",
                background: "transparent",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            className="input-field"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              margin: 0,
              padding: "4px 8px",
              fontSize: "0.72rem",
              width: "130px",
            }}
          >
            <option value="">👤 All Operators</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            style={{
              margin: 0,
              padding: "4px 8px",
              fontSize: "0.72rem",
              width: "120px",
            }}
          >
            <option value="">💳 All Payments</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT">Credit</option>
            <option value="COD">COD</option>
          </select>

          <select
            className="input-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              margin: 0,
              padding: "4px 8px",
              fontSize: "0.72rem",
              width: "150px",
            }}
          >
            <option value="date_desc">📅 Latest to Oldest</option>
            <option value="date_asc">📜 Oldest to Latest</option>
            <option value="amount_desc">📈 Highest to Lowest Amt</option>
            <option value="amount_asc">📉 Lowest to Highest Amt</option>
          </select>

          {(startDate ||
            endDate ||
            selectedUser ||
            paymentType ||
            sortBy !== "date_desc") && (
            <button
              className="btn"
              style={{
                fontSize: "0.7rem",
                padding: "4px 8px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "none",
                fontWeight: "bold",
              }}
              onClick={clearFilters}
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER & TABS */}
      <div
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn ${activeTab === "SALES" ? "btn-primary" : ""}`}
              style={{
                padding: "5px 12px",
                fontSize: "0.75rem",
                background: activeTab === "SALES" ? "#0d5c75" : "#f1f5f9",
                color: activeTab === "SALES" ? "#fff" : "#334155",
              }}
              onClick={() => setActiveTab("SALES")}
            >
              🛒 Retail Sales ({sales.length})
            </button>
            <button
              className={`btn ${activeTab === "REFUNDS" ? "btn-primary" : ""}`}
              style={{
                padding: "5px 12px",
                fontSize: "0.75rem",
                background: activeTab === "REFUNDS" ? "#0d5c75" : "#f1f5f9",
                color: activeTab === "REFUNDS" ? "#fff" : "#334155",
              }}
              onClick={() => setActiveTab("REFUNDS")}
            >
              🔄 Refunds & Returns ({refunds.length})
            </button>
            <button
              className={`btn ${activeTab === "EXPENSES" ? "btn-primary" : ""}`}
              style={{
                padding: "5px 12px",
                fontSize: "0.75rem",
                background: activeTab === "EXPENSES" ? "#0d5c75" : "#f1f5f9",
                color: activeTab === "EXPENSES" ? "#fff" : "#334155",
              }}
              onClick={() => setActiveTab("EXPENSES")}
            >
              💸 Operating Expenses ({expenses.length})
            </button>
            <button
              className={`btn ${activeTab === "PURCHASES" ? "btn-primary" : ""}`}
              style={{
                padding: "5px 12px",
                fontSize: "0.75rem",
                background: activeTab === "PURCHASES" ? "#0d5c75" : "#f1f5f9",
                color: activeTab === "PURCHASES" ? "#fff" : "#334155",
              }}
              onClick={() => setActiveTab("PURCHASES")}
            >
              📦 Stock Purchases ({purchases.length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn"
              style={{
                fontSize: "0.75rem",
                padding: "5px 10px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e0",
              }}
              onClick={loadFinancials}
            >
              🔄 Refresh
            </button>
            {activeTab === "EXPENSES" && (
              <button
                className="btn btn-primary"
                style={{
                  fontSize: "0.75rem",
                  padding: "5px 12px",
                  background: "#0d5c75",
                  color: "#fff",
                  fontWeight: "bold",
                }}
                onClick={() => setIsExpenseModalOpen(true)}
              >
                + Log New Expense
              </button>
            )}
          </div>
        </div>

        {/* 🌟 UNIFIED TABLE HEADER (11 Columns - Mode removed) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: unifiedGridTemplate,
            fontSize: "0.64rem",
            fontWeight: "bold",
            background: "#033c75",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: "6px",
            borderBottom: "1px solid #cbd5e0",
          }}
        >
          <span>DATE</span>
          <span>INVOICE ID</span>
          <span>CUSTOMER/SUPPLIER</span>
          <span>PAYMENT TYPE</span>
          <span>OPERATOR</span>
          <span>ITEM NAME</span>
          <span style={{ textAlign: "right" }}>QTY</span>
          <span style={{ textAlign: "right" }}>AMOUNT</span>
          <span style={{ textAlign: "right" }}>TOTAL</span>
          <span>DESCRIPTION</span>
          <span style={{ textAlign: "center" }}>ACTIONS</span>
        </div>

        {/* 🛒 SALES TAB */}
        {activeTab === "SALES" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              marginTop: "4px",
            }}
          >
            {sales.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "40px 0",
                  fontSize: "0.85rem",
                }}
              >
                No retail sales found matching criteria.
              </div>
            ) : (
              sales.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: unifiedGridTemplate,
                    fontSize: "0.72rem",
                    alignItems: "center",
                    background: "#fff",
                    padding: "8px 10px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {s.date}
                  </span>
                  <span
                    className="monospace"
                    style={{ fontWeight: "bold", color: "#0d5c75" }}
                  >
                    #INV-{s.sale_id}
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.customer_name || "Walk-in"}
                  </span>
                  <span>
                    <span
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      {s.payment_type}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    {s.username || "Cashier"}
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.item_name}
                  </span>
                  <span
                    className="monospace"
                    style={{ textAlign: "right", fontWeight: "bold" }}
                  >
                    {s.qty_sold}
                  </span>
                  <span className="monospace" style={{ textAlign: "right" }}>
                    Rs. {s.unit_price?.toLocaleString()}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#059669",
                    }}
                  >
                    Rs. {s.total_line?.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Retail Sale Item
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        border: "none",
                        padding: "3px 6px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                      onClick={() => openEditModal(s, "SALES")}
                    >
                      ✏️
                    </button>
                    {currentUser?.role?.toUpperCase() === "ADMIN" && (
                      <button
                        className="btn"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          padding: "3px 6px",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                        onClick={() => handleDeleteRecord(s.sale_id, "SALES")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 🔄 REFUNDS TAB */}
        {activeTab === "REFUNDS" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              marginTop: "4px",
            }}
          >
            {refunds.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "40px 0",
                  fontSize: "0.85rem",
                }}
              >
                No refund or return records logged yet.
              </div>
            ) : (
              refunds.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: unifiedGridTemplate,
                    fontSize: "0.72rem",
                    alignItems: "center",
                    background: "#fff5f5",
                    padding: "8px 10px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {r.date}
                  </span>
                  <span
                    className="monospace"
                    style={{ fontWeight: "bold", color: "#dc2626" }}
                  >
                    REF-{r.id}
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.customer_name || "Walk-in"}
                  </span>
                  <span>
                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      REFUND
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    {r.username || "Manager"}
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#dc2626",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.item_name || "General Return"}
                  </span>
                  <span
                    className="monospace"
                    style={{ textAlign: "right", fontWeight: "bold" }}
                  >
                    {r.qty}
                  </span>
                  <span className="monospace" style={{ textAlign: "right" }}>
                    Rs. {r.amount_refunded?.toLocaleString()}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#dc2626",
                    }}
                  >
                    - Rs. {r.amount_refunded?.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.description || "Item Returned"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        border: "none",
                        padding: "3px 6px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                      onClick={() => openEditModal(r, "REFUNDS")}
                    >
                      ✏️
                    </button>
                    {currentUser?.role?.toUpperCase() === "ADMIN" && (
                      <button
                        className="btn"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          padding: "3px 6px",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                        onClick={() => handleDeleteRecord(r.id, "REFUNDS")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 💸 EXPENSES TAB */}
        {activeTab === "EXPENSES" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              marginTop: "4px",
            }}
          >
            {expenses.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "40px 0",
                  fontSize: "0.85rem",
                }}
              >
                No operating expenses recorded yet.
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: unifiedGridTemplate,
                    fontSize: "0.72rem",
                    alignItems: "center",
                    background: "#fff",
                    padding: "8px 10px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {exp.date}
                  </span>
                  <span
                    className="monospace"
                    style={{ fontWeight: "bold", color: "#dc2626" }}
                  >
                    EXP-{exp.id}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#1e293b" }}>
                    Store Overhead
                  </span>
                  <span>
                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      CASH
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    {exp.username || "Manager"}
                  </span>
                  <span style={{ fontWeight: "600", color: "#475569" }}>
                    {exp.category}
                  </span>
                  <span className="monospace" style={{ textAlign: "right" }}>
                    1
                  </span>
                  <span className="monospace" style={{ textAlign: "right" }}>
                    Rs. {exp.amount?.toLocaleString()}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#ef4444",
                    }}
                  >
                    - Rs. {exp.amount?.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={exp.description}
                  >
                    {exp.description || "—"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        border: "none",
                        padding: "3px 6px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                      onClick={() => openEditModal(exp, "EXPENSES")}
                    >
                      ✏️
                    </button>
                    {currentUser?.role?.toUpperCase() === "ADMIN" && (
                      <button
                        className="btn"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          padding: "3px 6px",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                        onClick={() => handleDeleteRecord(exp.id, "EXPENSES")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 📦 PURCHASES TAB */}
        {activeTab === "PURCHASES" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              marginTop: "4px",
            }}
          >
            {purchases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "40px 0",
                  fontSize: "0.85rem",
                }}
              >
                No stock purchases (GRNs) recorded yet.
              </div>
            ) : (
              purchases.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: unifiedGridTemplate,
                    fontSize: "0.72rem",
                    alignItems: "center",
                    background: "#fff",
                    padding: "8px 10px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {p.date}
                  </span>
                  <span
                    className="monospace"
                    style={{ fontWeight: "bold", color: "#0284c7" }}
                  >
                    {p.invoice_no || `GRN-${p.id}`}
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.supplier_name || "Direct Stock"}
                  </span>
                  <span>
                    <span
                      style={{
                        background:
                          p.payment_type === "CASH" ? "#d1fae5" : "#fef3c7",
                        color:
                          p.payment_type === "CASH" ? "#065f46" : "#d97706",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      {p.payment_type || "CREDIT"}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    {p.username || "Manager"}
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.item_name}
                  </span>
                  <span
                    className="monospace"
                    style={{ textAlign: "right", fontWeight: "bold" }}
                  >
                    {p.qty_received}
                  </span>
                  <span
                    className="monospace"
                    style={{ textAlign: "right", color: "#64748b" }}
                  >
                    Rs. {p.unit_cost?.toLocaleString()}
                  </span>
                  <span
                    className="monospace"
                    style={{
                      textAlign: "right",
                      fontWeight: "900",
                      color: "#f59e0b",
                    }}
                  >
                    Rs. {(p.qty_received * p.unit_cost)?.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Stock Intake
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        border: "none",
                        padding: "3px 6px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                      onClick={() => openEditModal(p, "PURCHASES")}
                    >
                      ✏️
                    </button>
                    {currentUser?.role?.toUpperCase() === "ADMIN" && (
                      <button
                        className="btn"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          padding: "3px 6px",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                        onClick={() => handleDeleteRecord(p.id, "PURCHASES")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{ width: "380px", background: "#fff", padding: "16px" }}
          >
            <h3>💸 Record Operating Expense</h3>
            <form
              onSubmit={handleAddExpense}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <select
                className="input-field"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
              >
                <option value="Rent">🏢 Store Rent</option>
                <option value="Utilities">💡 Electricity & Utilities</option>
                <option value="Travel">🚗 Travel & Transport</option>
                <option value="Salaries">👨‍💼 Staff Salaries</option>
                <option value="Food">🍲 Food / Refreshments</option>
                <option value="Other">📦 Miscellaneous</option>
              </select>
              <input
                type="number"
                className="input-field"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="Amount (Rs.)"
                required
              />
              <input
                type="text"
                className="input-field"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                placeholder="Description / Note"
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: "#ef4444", color: "#fff" }}
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#cbd5e0" }}
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRecord && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: "420px",
              background: "#fff",
              padding: "20px",
              color: "#000",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                ✏️ Edit{" "}
                {editingRecord.type === "SALES"
                  ? "Sale Invoice"
                  : editingRecord.type === "REFUNDS"
                    ? "Refund Record"
                    : editingRecord.type === "EXPENSES"
                      ? "Expense Record"
                      : "Stock Purchase"}
              </h3>
              <button
                className="btn"
                style={{ background: "#e2e8f0", padding: "2px 8px" }}
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {editingRecord.type === "SALES" && (
                <>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Total Invoice Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.total_amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          total_amount: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Payment Type
                    </label>
                    <select
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.payment_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          payment_type: e.target.value,
                        })
                      }
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                </>
              )}

              {editingRecord.type === "REFUNDS" && (
                <>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Refund Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.amount_refunded}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          amount_refunded: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Quantity Returned
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.qty}
                      onChange={(e) =>
                        setEditForm({ ...editForm, qty: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Description / Reason
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {editingRecord.type === "EXPENSES" && (
                <>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Description / Remarks
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {editingRecord.type === "PURCHASES" && (
                <>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Received Quantity
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.qty_received}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          qty_received: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Unit Cost (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.unit_cost}
                      onChange={(e) =>
                        setEditForm({ ...editForm, unit_cost: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
                      Payment Mode
                    </label>
                    <select
                      className="input-field"
                      style={{ padding: "6px" }}
                      value={editForm.payment_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          payment_type: e.target.value,
                        })
                      }
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: "#0d5c75",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#cbd5e0" }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
