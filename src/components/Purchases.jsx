import React, { useState, useEffect, useRef } from "react";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function Purchases({ currentUser }) {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("GRID"); // 'GRID' or 'LIST'

  // Purchase Form State
  const [purchaseType, setPurchaseType] = useState("REGISTERED"); // 'REGISTERED' or 'DIRECT'
  const [purchase, setPurchase] = useState({
    supplier_id: "",
    custom_supplier_name: "",
    item_id: "",
    qty_received: "",
    unit_cost: "",
    payment_type: "CREDIT", // 'CREDIT' or 'CASH'
    invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().substring(0, 10),
  });

  // Item Search Lookup States
  const [itemSearchText, setItemSearchText] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadData = async () => {
    const ipc = getIpc();
    if (ipc) {
      const fetchedItems = await ipc.invoke("get-items");
      const fetchedSuppliers = await ipc.invoke("get-suppliers");

      setItems(fetchedItems || []);
      setSuppliers(fetchedSuppliers || []);
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

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    if (!purchase.item_id)
      return alert(
        "Please select an inventory item from the lookup search or product cards.",
      );

    const ipc = getIpc();
    if (ipc) {
      const finalInvoiceNo =
        purchaseType === "DIRECT" && purchase.custom_supplier_name
          ? `${purchase.invoice_no} [Vendor: ${purchase.custom_supplier_name}]`
          : purchase.invoice_no;

      const res = await ipc.invoke("record-purchase", {
        supplier_id:
          purchaseType === "REGISTERED" ? purchase.supplier_id : null,
        item_id: purchase.item_id,
        qty_received: parseFloat(purchase.qty_received),
        unit_cost: parseFloat(purchase.unit_cost),
        payment_type: purchase.payment_type,
        invoice_no: finalInvoiceNo,
        date: purchase.date,
        currentUser,
      });

      if (res.success) {
        alert(
          "✅ Stock received & Weighted Average Cost updated successfully!",
        );
        setPurchase({
          supplier_id: "",
          custom_supplier_name: "",
          item_id: "",
          qty_received: "",
          unit_cost: "",
          payment_type: "CREDIT",
          invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().substring(0, 10),
        });
        setItemSearchText("");
        loadData();
      } else {
        alert("Error: " + res.error);
      }
    }
  };

  // Filter items for lookup and catalog view
  const filteredLookupItems = items.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(itemSearchText.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(itemSearchText.toLowerCase()),
  );

  const filteredCatalogItems = items.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(search.toLowerCase()),
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
            📦 Stock Purchases & GRN Intake
          </h3>
        </div>
      </div>

      {/* SPLIT WORKSPACE: FORM (LEFT) & CATALOG CARDS (RIGHT) */}
      <div
        style={{ display: "flex", gap: "16px", flex: 1, overflow: "hidden" }}
      >
        {/* LEFT FORM PANEL */}
        <div
          className="card"
          style={{
            flex: "1",
            background: "#ffffff",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid #e2e8f0",
            overflowY: "auto",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "0.95rem",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Log Stock Addition / GRN
          </h4>

          <form
            onSubmit={handleRecordPurchase}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* PURCHASE SOURCE TOGGLE */}
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
                Purchase Source
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background:
                      purchaseType === "REGISTERED" ? "#0284c7" : "#f1f5f9",
                    color: purchaseType === "REGISTERED" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() => setPurchaseType("REGISTERED")}
                >
                  Registered Supplier
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background:
                      purchaseType === "DIRECT" ? "#0284c7" : "#f1f5f9",
                    color: purchaseType === "DIRECT" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() => setPurchaseType("DIRECT")}
                >
                  Direct / Custom Buy
                </button>
              </div>
            </div>

            {purchaseType === "REGISTERED" ? (
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  Select Wholesaler
                </label>
                <select
                  className="input-field"
                  value={purchase.supplier_id}
                  onChange={(e) =>
                    setPurchase({ ...purchase, supplier_id: e.target.value })
                  }
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  required
                >
                  <option value="">-- Choose Wholesaler --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || "Direct"})
                    </option>
                  ))}
                </select>
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
                  Custom Vendor / Market Name (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={purchase.custom_supplier_name}
                  onChange={(e) =>
                    setPurchase({
                      ...purchase,
                      custom_supplier_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Wholesale Market"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                />
              </div>
            )}

            {/* PAYMENT TYPE TOGGLE */}
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
                Payment Mode
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background:
                      purchase.payment_type === "CREDIT"
                        ? "#0d5c75"
                        : "#f1f5f9",
                    color:
                      purchase.payment_type === "CREDIT" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: "CREDIT" })
                  }
                >
                  Credit Purchase (Khata)
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    padding: "6px",
                    fontSize: "0.75rem",
                    background:
                      purchase.payment_type === "CASH" ? "#059669" : "#f1f5f9",
                    color:
                      purchase.payment_type === "CASH" ? "#fff" : "#475569",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e0",
                  }}
                  onClick={() =>
                    setPurchase({ ...purchase, payment_type: "CASH" })
                  }
                >
                  Cash Purchase (Paid)
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
                  Bill / Invoice No.
                </label>
                <input
                  type="text"
                  className="input-field monospace"
                  value={purchase.invoice_no}
                  onChange={(e) =>
                    setPurchase({ ...purchase, invoice_no: e.target.value })
                  }
                  style={{ padding: "8px", fontSize: "0.8rem" }}
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
                  Purchase Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={purchase.date}
                  onChange={(e) =>
                    setPurchase({ ...purchase, date: e.target.value })
                  }
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  required
                />
              </div>
            </div>

            {/* SEARCHABLE ITEM LOOKUP INPUT */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#475569",
                }}
              >
                Quick Lookup Item (Search by Name or SKU)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="🔍 Type product name to search..."
                value={itemSearchText}
                onChange={(e) => {
                  setItemSearchText(e.target.value);
                  setIsItemDropdownOpen(true);
                }}
                onFocus={() => setIsItemDropdownOpen(true)}
                style={{ padding: "8px", fontSize: "0.8rem" }}
                required
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
                      No matching items found.
                    </div>
                  ) : (
                    filteredLookupItems.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setPurchase({
                            ...purchase,
                            item_id: i.id,
                            unit_cost: i.avg_cost || "",
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
                        <span style={{ fontWeight: "bold", color: "#1e293b" }}>
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
                  Received Qty
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={purchase.qty_received}
                  onChange={(e) =>
                    setPurchase({ ...purchase, qty_received: e.target.value })
                  }
                  placeholder="50"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
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
                  Wholesale Unit Cost (Rs.)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={purchase.unit_cost}
                  onChange={(e) =>
                    setPurchase({ ...purchase, unit_cost: e.target.value })
                  }
                  placeholder="1150"
                  style={{ padding: "8px", fontSize: "0.8rem" }}
                  required
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
                Estimated Total (Rs.)
              </label>
              <input
                type="text"
                className="input-field monospace"
                value={(
                  (parseFloat(purchase.qty_received) || 0) *
                  (parseFloat(purchase.unit_cost) || 0)
                ).toLocaleString()}
                disabled
                style={{
                  background: "#f8fafc",
                  fontWeight: "bold",
                  color: "#0284c7",
                  padding: "8px",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "10px",
                marginTop: "6px",
                background: "#0284c7",
                fontWeight: "bold",
                fontSize: "0.85rem",
              }}
            >
              Record Purchase
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: INVENTORY CATALOG CARDS WITH VIEW TOGGLE */}
        <div
          className="card"
          style={{
            flex: "2.3",
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
              Inventory Catalog (Click to Restock)
            </h4>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="input-field"
                placeholder="🔍 Search SKU or product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "220px",
                  margin: 0,
                  padding: "6px 10px",
                  fontSize: "0.78rem",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "#f1f5f9",
                  padding: "3px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e0",
                }}
              >
                <button
                  className="btn"
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.7rem",
                    background: viewMode === "GRID" ? "#0d5c75" : "transparent",
                    color: viewMode === "GRID" ? "#fff" : "#334155",
                    border: "none",
                    fontWeight: "bold",
                    borderRadius: "4px",
                  }}
                  onClick={() => setViewMode("GRID")}
                >
                  🔲 Grid
                </button>
                <button
                  className="btn"
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.7rem",
                    background: viewMode === "LIST" ? "#0d5c75" : "transparent",
                    color: viewMode === "LIST" ? "#fff" : "#334155",
                    border: "none",
                    fontWeight: "bold",
                    borderRadius: "4px",
                  }}
                  onClick={() => setViewMode("LIST")}
                >
                  📋 List
                </button>
              </div>
            </div>
          </div>

          {/* CATALOG DISPLAY CONTAINER */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {viewMode === "GRID" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {filteredCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          background: "#f8fafc",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #cbd5e0",
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
                          <span style={{ fontSize: "1.2rem" }}>📦</span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          SKU: {item.code}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: item.stock_qty <= 5 ? "#dc2626" : "#059669",
                            fontWeight: "bold",
                          }}
                        >
                          Stock: {item.stock_qty} {item.unit}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "6px",
                        fontSize: "0.7rem",
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#475569",
                      }}
                    >
                      <span>Cost (WAC):</span>
                      <span
                        className="monospace"
                        style={{ fontWeight: "bold" }}
                      >
                        Rs. {item.avg_cost?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{
                        padding: "6px",
                        fontSize: "0.72rem",
                        background: "#0284c7",
                        fontWeight: "bold",
                        width: "100%",
                      }}
                      onClick={() => {
                        setPurchase({
                          ...purchase,
                          item_id: item.id,
                          unit_cost: item.avg_cost || "",
                        });
                        setItemSearchText(
                          `${item.name} (${item.code}) - Stock: ${item.stock_qty} ${item.unit}`,
                        );
                      }}
                    >
                      ⚡ Quick Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    background: "#033c75",
                    color: "#fff",
                    padding: "8px 10px",
                    borderRadius: "6px",
                  }}
                >
                  <span>SKU</span>
                  <span>PRODUCT NAME</span>
                  <span style={{ textAlign: "right" }}>STOCK QTY</span>
                  <span style={{ textAlign: "right" }}>UNIT COST</span>
                  <span style={{ textAlign: "center" }}>ACTION</span>
                </div>

                {filteredCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                      fontSize: "0.75rem",
                      alignItems: "center",
                      background: "#fff",
                      padding: "8px 10px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <span className="monospace" style={{ color: "#64748b" }}>
                      {item.code}
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
                      {item.name}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                        color: item.stock_qty <= 5 ? "#dc2626" : "#059669",
                      }}
                    >
                      {item.stock_qty} {item.unit}
                    </span>
                    <span className="monospace" style={{ textAlign: "right" }}>
                      Rs. {item.avg_cost?.toFixed(2) || "0.00"}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-primary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.7rem",
                          background: "#0284c7",
                          fontWeight: "bold",
                        }}
                        onClick={() => {
                          setPurchase({
                            ...purchase,
                            item_id: item.id,
                            unit_cost: item.avg_cost || "",
                          });
                          setItemSearchText(
                            `${item.name} (${item.code}) - Stock: ${item.stock_qty} ${item.unit}`,
                          );
                        }}
                      >
                        ⚡ Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredCatalogItems.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "40px 0",
                  fontSize: "0.85rem",
                }}
              >
                No products found in inventory.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
