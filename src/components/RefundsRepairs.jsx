import React, { useState, useEffect, useRef } from "react";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function RefundsRepairs({ currentUser }) {
  const [items, setItems] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Form State
  const [form, setForm] = useState({
    type: "REFUND", // 'REFUND' or 'REPAIR'
    sale_id: "",
    item_id: "",
    qty: 1,
    amount_refunded: "",
    customer_name: "",
    phone: "",
    description: "",
  });

  // Manual Custom Item Mode (for items not currently in the inventory catalog)
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualItemName, setManualItemName] = useState("");

  // Item Search Lookup States
  const [itemSearchText, setItemSearchText] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      const fetchedItems = await ipc.invoke("get-items");
      setItems(fetchedItems || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close item dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id && !manualItemName) {
      return alert(
        "Please select an item from inventory or enter a custom item name.",
      );
    }

    const ipc = getIpc();
    if (ipc) {
      let targetItemId = form.item_id;

      // If manual mode is active and a custom item name is provided, register it to inventory first
      if (isManualMode && manualItemName.trim()) {
        const newItemPayload = {
          code: `MAN-${Math.floor(1000 + Math.random() * 9000)}`,
          name: manualItemName.trim(),
          category: "Returned / Repaired",
          stock_qty: 0,
          avg_cost: 0,
          min_price: 0,
          max_price: 0,
          selling_price: parseFloat(form.amount_refunded) || 0,
          unit: "Pcs",
          image_path: "",
        };
        const addRes = await ipc.invoke("add-item", {
          item: newItemPayload,
          currentUser,
        });
        if (addRes.success && addRes.itemId) {
          targetItemId = addRes.itemId;
        }
      }

      const res = await ipc.invoke("record-refund-repair", {
        ...form,
        item_id: targetItemId,
        currentUser,
      });

      if (res.success) {
        alert(
          `✅ ${
            form.type === "REFUND"
              ? "Refund processed successfully! Stock added back to inventory & recorded in Ledger."
              : "Repair ticket logged successfully."
          }`,
        );
        setForm({
          type: "REFUND",
          sale_id: "",
          item_id: "",
          qty: 1,
          amount_refunded: "",
          customer_name: "",
          phone: "",
          description: "",
        });
        setItemSearchText("");
        setManualItemName("");
        setIsManualMode(false);
        loadData();
      } else {
        alert("Error: " + res.error);
      }
    }
  };

  // 🔍 Filter items for quick lookup
  const filteredLookupItems = items.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(itemSearchText.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(itemSearchText.toLowerCase()),
  );

  // Filter items for the catalog grid view
  const filteredCatalogItems = items.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(catalogSearch.toLowerCase()),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "calc(100vh - 80px)",
        overflow: "hidden",
        color: "#1e293b",
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#1e293b" }}>
            🔄 Refunds & Repairs Management
          </h3>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: "16px", flex: 1, overflow: "hidden" }}
      >
        {/* LEFT FORM PANEL */}
        <div
          className="card"
          style={{
            flex: 1.1,
            background: "#ffffff",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid #e2e8f0",
            overflowY: "auto",
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
            <h4
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Log Return / Repair Ticket
            </h4>
            <button
              type="button"
              className="btn"
              style={{
                fontSize: "0.7rem",
                padding: "4px 8px",
                background: isManualMode ? "#0d5c75" : "#f1f5f9",
                color: isManualMode ? "#fff" : "#334155",
                fontWeight: "bold",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
              }}
              onClick={() => {
                setIsManualMode(!isManualMode);
                setForm({ ...form, item_id: "" });
                setItemSearchText("");
              }}
            >
              {isManualMode
                ? "🔍 Use Catalog Search"
                : "+ Add Custom Item Manually"}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* TYPE TOGGLE */}
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#475569",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Operation Type
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background: form.type === "REFUND" ? "#e11d48" : "#f1f5f9",
                    color: form.type === "REFUND" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() => setForm({ ...form, type: "REFUND" })}
                >
                  🔄 Item Refund (Stock Return)
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background: form.type === "REPAIR" ? "#0284c7" : "#f1f5f9",
                    color: form.type === "REPAIR" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() => setForm({ ...form, type: "REPAIR" })}
                >
                  🛠️ Device Repair / Service
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Customer Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  placeholder="Customer Name"
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0300-0000000"
                />
              </div>
            </div>

            {/* CONDITIONAL ITEM INPUT */}
            {!isManualMode ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Select Existing Product (Search Name or SKU)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="🔍 Type product name..."
                  value={itemSearchText}
                  onChange={(e) => {
                    setItemSearchText(e.target.value);
                    setIsItemDropdownOpen(true);
                  }}
                  onFocus={() => setIsItemDropdownOpen(true)}
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  required={!form.item_id}
                />

                {isItemDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "180px",
                      overflowY: "auto",
                      background: "#fff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 999,
                      marginTop: "2px",
                    }}
                  >
                    {filteredLookupItems.length === 0 ? (
                      <div
                        style={{
                          padding: "10px",
                          fontSize: "0.78rem",
                          color: "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        No matching items found. Click "+ Add Custom Item" above
                        if it's new.
                      </div>
                    ) : (
                      filteredLookupItems.map((i) => (
                        <div
                          key={i.id}
                          onClick={() => {
                            setForm({
                              ...form,
                              item_id: i.id,
                              amount_refunded: i.selling_price || "",
                            });
                            setItemSearchText(
                              `${i.name} (${i.code}) - Stock: ${i.stock_qty} ${i.unit}`,
                            );
                            setIsItemDropdownOpen(false);
                          }}
                          style={{
                            padding: "8px 10px",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold", color: "#1e293b" }}
                          >
                            {i.name}{" "}
                            <span
                              style={{ color: "#64748b", fontWeight: "normal" }}
                            >
                              ({i.code})
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#0284c7",
                              background: "#e0f2fe",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Stock: {i.stock_qty} {i.unit}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Manual / New Item Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    padding: "8px",
                    fontSize: "0.8rem",
                    background: "#fdf8f6",
                  }}
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  placeholder="e.g. Unlisted Custom Part / Accessory"
                  required={isManualMode}
                />
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Quantity / Units
                </label>
                <input
                  type="number"
                  className="input-field"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Amount Refunded (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  value={form.amount_refunded}
                  onChange={(e) =>
                    setForm({ ...form, amount_refunded: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#475569",
                }}
              >
                Reason / Repair Details
              </label>
              <textarea
                className="input-field"
                style={{ padding: "8px", fontSize: "0.8rem", height: "60px" }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Defective return / Repair notes..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "10px",
                background: "#0284c7",
                fontWeight: "bold",
                fontSize: "0.85rem",
              }}
            >
              Submit & Post to Ledger
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: 3x3 CATALOG CARDS GRID WITH PRICES */}
        <div
          className="card"
          style={{
            flex: 2.3,
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "#0f172a",
                }}
              >
                Fix / Return Catalog Items
              </h4>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Click any product card to select it for return or repair.
              </span>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="🔍 Search catalog..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              style={{
                width: "220px",
                margin: 0,
                padding: "6px 10px",
                fontSize: "0.78rem",
              }}
            />
          </div>

          {/* 🌟 3x3 CATALOG ITEM GRID CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "repeat(3, 1fr)",
              gap: "12px",
              flex: 1,
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {filteredCatalogItems.slice(0, 9).map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0284c7";
                  e.currentTarget.style.boxShadow =
                    "0 6px 12px rgba(2, 132, 199, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.02)";
                }}
              >
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {item.image_path ? (
                      <img
                        src={item.image_path}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "1rem" }}>📦</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.78rem",
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                      SKU: {item.code}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#0284c7",
                          fontWeight: "bold",
                        }}
                      >
                        Stock: {item.stock_qty} {item.unit}
                      </span>
                      <span
                        className="monospace"
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "900",
                          color: "#059669",
                        }}
                      >
                        Rs. {item.selling_price?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn"
                  style={{
                    background: "#0284c7",
                    color: "#fff",
                    fontSize: "0.7rem",
                    padding: "5px",
                    fontWeight: "bold",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setIsManualMode(false);
                    setForm({
                      ...form,
                      item_id: item.id,
                      amount_refunded: item.selling_price || "",
                    });
                    setItemSearchText(
                      `${item.name} (${item.code}) - Stock: ${item.stock_qty} ${item.unit}`,
                    );
                  }}
                >
                  ⚡ Select Item
                </button>
              </div>
            ))}
            {filteredCatalogItems.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "50px 0",
                  fontSize: "0.85rem",
                }}
              >
                No products found in inventory. Use the "+ Add Custom Item
                Manually" toggle on the left if needed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
