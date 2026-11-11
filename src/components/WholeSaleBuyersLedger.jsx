import React, { useState, useEffect } from 'react';
import { getIpc } from '../utils/ipc';

export default function KhataLedger({ currentUser }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('active'); // 'active' | 'archived' | 'all'

  // Advanced Ledger Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    credit_limit: 0,
    avatar: '',
  });

  const loadCustomers = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke('get-customers');
      setCustomers(data || []);
      if (selectedCustomer) {
        const refreshed = (data || []).find(
          (c) => c.id === selectedCustomer.id,
        );
        if (refreshed) {
          setSelectedCustomer(refreshed);
          loadLedger(refreshed.id);
        }
      }
    }
  };

  const loadLedger = async (customerId) => {
    const ipc = getIpc();
    if (ipc) {
      const entries = await ipc.invoke('get-customer-ledger', customerId);
      setLedgerEntries(entries || []);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const selectCustomer = (cust) => {
    setSelectedCustomer(cust);
    loadLedger(cust.id);
    setFilterStartDate('');
    setFilterEndDate('');
    setLedgerSearch('');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      let res;
      if (editingCustomer) {
        res = await ipc.invoke('update-customer', {
          id: editingCustomer.id,
          name: customerForm.name,
          phone: customerForm.phone,
          credit_limit: customerForm.credit_limit,
          avatar: customerForm.avatar,
        });
      } else {
        res = await ipc.invoke('add-customer', customerForm);
      }

      if (res.success) {
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        setCustomerForm({ name: '', phone: '', credit_limit: 0, avatar: '' });
        loadCustomers();
      } else {
        alert('Error saving customer profile: ' + res.error);
      }
    }
  };

  // Archive / Reactivate Customer Workflow
  const handleToggleArchiveCustomer = async (cust) => {
    const target = cust || selectedCustomer;
    if (!target) return;

    if (currentUser?.role !== 'ADMIN') {
      return alert('Access Denied: Manager (ADMIN) permissions required.');
    }

    if (target.balance > 0 && target.is_active === 1) {
      return alert(
        'Cannot archive party while outstanding debt balance is due.',
      );
    }

    const nextActiveState = target.is_active === 0 ? 1 : 0;
    const actionText = nextActiveState === 0 ? 'archive' : 'reactivate';
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} customer "${target.name}"?`,
      )
    )
      return;

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke('toggle-archive-customer', {
        customerId: target.id,
        is_active: nextActiveState,
        currentUser,
      });

      if (res.success) {
        if (selectedCustomer?.id === target.id) {
          setSelectedCustomer(null);
          setLedgerEntries([]);
        }
        loadCustomers();
      } else {
        alert('Action Error: ' + res.error);
      }
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return alert('Enter a valid settlement amount.');

    if (ipc) {
      const res = await ipc.invoke('record-customer-payment', {
        customer_id: selectedCustomer.id,
        amount: amt,
        payment_method: paymentMethod,
        notes: paymentNotes,
        currentUser,
      });

      if (res.success) {
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentNotes('');
        loadCustomers();
      } else {
        alert('Payment Error: ' + res.error);
      }
    }
  };

  // CREDIT LIMIT GUARDRAIL CHECK DURING DEBT ADDITION
  const handleAddDebt = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(debtAmount);
    if (!amt || amt <= 0) return alert('Enter a valid debt amount.');

    const currentBalance = selectedCustomer.balance || 0;
    const creditLimit = selectedCustomer.credit_limit || 0;

    if (creditLimit > 0 && currentBalance + amt > creditLimit) {
      const override = window.confirm(
        `⚠️ CREDIT LIMIT BREACH WARNING:\n\nThis debit of Rs. ${amt.toLocaleString()} will push the total balance (Rs. ${(currentBalance + amt).toLocaleString()}) past the credit limit of Rs. ${creditLimit.toLocaleString()}.\n\nDo you want to proceed anyway?`,
      );
      if (!override) return;
    }

    if (ipc) {
      const res = await ipc.invoke('record-customer-debt', {
        customer_id: selectedCustomer.id,
        amount: amt,
        notes: debtNotes,
        currentUser,
      });

      if (res.success) {
        setIsDebtModalOpen(false);
        setDebtAmount('');
        setDebtNotes('');
        loadCustomers();
      } else {
        alert('Debt Adjustment Error: ' + res.error);
      }
    }
  };

  const handleAddCreditAdjustment = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) return alert('Enter a valid credit amount.');

    if (ipc) {
      const res = await ipc.invoke('record-customer-payment', {
        customer_id: selectedCustomer.id,
        amount: amt,
        payment_method: 'DISCOUNT/RETURN',
        notes: creditNotes || 'Manual Credit / Discount Adjustment',
        currentUser,
      });

      if (res.success) {
        setIsCreditModalOpen(false);
        setCreditAmount('');
        setCreditNotes('');
        loadCustomers();
      } else {
        alert('Credit Adjustment Error: ' + res.error);
      }
    }
  };

  // 📄 PROFESSIONAL CORPORATE A4 PDF STATEMENT EXPORT
  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (ipc && selectedCustomer) {
      const rowsHtml = filteredLedger
        .map(
          (e) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.date}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.description}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #dc2626; text-align: right;">${e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #059669; text-align: right;">${e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0f172a; text-align: right;">Rs. ${e.balance_after?.toLocaleString()}</td>
        </tr>
      `,
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Customer Statement - ${selectedCustomer.name}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; margin: 0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d5c75; padding-bottom: 16px; margin-bottom: 24px; }
              .title-area h1 { margin: 0; color: #0d5c75; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
              .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
              .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
              .right { text-align: right; }
              .total-card { margin-top: 24px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: right; float: right; width: 280px; }
              .total-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
              .total-card .amount { font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>Customer Khata Statement</h1>
                <p>ShopMate Enterprise Business Intelligence & Accounting</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold; font-size: 13px;">Issued Date: ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Status: ${selectedCustomer.is_active === 0 ? 'Archived Party' : 'Active Account'}</p>
              </div>
            </div>

            <div class="meta-box">
              <div>
                <strong>Party Name:</strong> ${selectedCustomer.name}<br/>
                <strong>Phone Number:</strong> ${selectedCustomer.phone || 'N/A'}<br/>
                <strong>Credit Limit:</strong> Rs. ${selectedCustomer.credit_limit?.toLocaleString()}
              </div>
              <div>
                <strong>Account ID:</strong> #${selectedCustomer.id}<br/>
                <strong>Operator:</strong> ${currentUser?.username || 'Manager'}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description / Reference</th>
                  <th class="right">Debit (+)</th>
                  <th class="right">Credit (-)</th>
                  <th class="right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="total-card">
              <div class="label">Net Outstanding Balance Due</div>
              <div class="amount">Rs. ${selectedCustomer.balance?.toLocaleString()}</div>
            </div>
          </body>
        </html>
      `;

      const res = await ipc.invoke('export-ledger-pdf', html);
      if (res.success && !res.canceled) {
        alert(
          `✅ Corporate A4 Customer statement exported successfully:\n${res.filePath}`,
        );
      } else if (!res.canceled) {
        alert(`PDF Export failed: ${res.error}`);
      }
    }
  };

  // Directory filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (customerFilter === 'active')
      return c.is_active === 1 || c.is_active === undefined;
    if (customerFilter === 'archived') return c.is_active === 0;
    return true; // 'all'
  });

  const filteredLedger = ledgerEntries.filter((entry) => {
    const matchesSearch = (entry.description || '')
      .toLowerCase()
      .includes(ledgerSearch.toLowerCase());

    let matchesDate = true;
    const entryDate = entry.date ? entry.date.substring(0, 10) : '';

    if (filterStartDate && entryDate < filterStartDate) matchesDate = false;
    if (filterEndDate && entryDate > filterEndDate) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
      }}
    >
      {/* 👥 LEFT COLUMN: PARTY DIRECTORY */}
      <div
        className="card"
        style={{
          flex: '1.1',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '14px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h4
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '0.95rem',
                fontWeight: 'bold',
              }}
            >
              Whole Sale Buyers
            </h4>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Showing {filteredCustomers.length} records
            </span>
          </div>
          <button
            className="btn btn-primary"
            style={{
              fontSize: '0.72rem',
              padding: '6px 12px',
              background: '#0d5c75',
              color: '#fff',
              fontWeight: 'bold',
            }}
            onClick={() => {
              setEditingCustomer(null);
              setCustomerForm({
                name: '',
                phone: '',
                credit_limit: 0,
                avatar: '',
              });
              setIsCustomerModalOpen(true);
            }}
          >
            + Add Party
          </button>
        </div>

        {/* ACTIVE / ARCHIVED FILTER PILLS */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '6px',
          }}
        >
          {[
            { id: 'active', label: 'Active' },
            { id: 'archived', label: 'Archived' },
            { id: 'all', label: 'All Parties' },
          ].map((pill) => (
            <button
              key={pill.id}
              className="btn"
              style={{
                flex: 1,
                fontSize: '0.68rem',
                padding: '4px',
                border: 'none',
                borderRadius: '4px',
                fontWeight: customerFilter === pill.id ? 'bold' : 'normal',
                background: customerFilter === pill.id ? '#fff' : 'transparent',
                color: customerFilter === pill.id ? '#0d5c75' : '#64748b',
                boxShadow:
                  customerFilter === pill.id
                    ? '0 1px 2px rgba(0,0,0,0.05)'
                    : 'none',
              }}
              onClick={() => setCustomerFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search party name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: 0, padding: '7px 10px', fontSize: '0.75rem' }}
        />

        <div
          style={{
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
          }}
        >
          {filteredCustomers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '30px 0',
                fontSize: '0.75rem',
              }}
            >
              No party records found.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const hasDebt = cust.balance > 0;
              const isArchived = cust.is_active === 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => selectCustomer(cust)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected
                      ? '#e0f2fe'
                      : isArchived
                        ? '#f8fafc'
                        : '#fff',
                    border: isSelected
                      ? '1px solid #0284c7'
                      : '1px solid #f1f5f9',
                    opacity: isArchived ? 0.7 : 1,
                  }}
                >
                  {cust.avatar ? (
                    <img
                      src={cust.avatar}
                      alt={cust.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isArchived ? '#94a3b8' : '#0d5c75',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        flexShrink: 0,
                      }}
                    >
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cust.name}{' '}
                      {isArchived && (
                        <span style={{ fontSize: '0.65rem', color: '#d97706' }}>
                          (Archived)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {cust.phone || 'No phone'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="monospace"
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        color: hasDebt ? '#dc2626' : '#059669',
                      }}
                    >
                      Rs. {cust.balance?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                      {hasDebt ? 'Debt Due' : 'Clear'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📊 RIGHT COLUMN: PARTY LEDGER STATEMENT & ADVANCED FILTERS */}
      <div
        className="card"
        style={{
          flex: '2.3',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {selectedCustomer ? (
          <>
            {/* PARTY HEADER & ACTION TOOLBAR */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {selectedCustomer.avatar ? (
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #0d5c75',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background:
                        selectedCustomer.is_active === 0
                          ? '#94a3b8'
                          : '#0d5c75',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                    }}
                  >
                    {selectedCustomer.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3
                    style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem' }}
                  >
                    {selectedCustomer.name}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Phone: <strong>{selectedCustomer.phone || 'N/A'}</strong> |
                    Credit Limit:{' '}
                    <span className="monospace">
                      Rs. {selectedCustomer.credit_limit?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  className="btn btn-success"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  💵 Receive Cash
                </button>
                <button
                  className="btn"
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsDebtModalOpen(true)}
                >
                  + Debt
                </button>
                <button
                  className="btn"
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setIsCreditModalOpen(true)}
                >
                  + Credit
                </button>
                <button
                  className="btn"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    background: '#f1f5f9',
                    color: '#334155',
                    fontWeight: 'bold',
                  }}
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setCustomerForm({
                      name: selectedCustomer.name || '',
                      phone: selectedCustomer.phone || '',
                      credit_limit: selectedCustomer.credit_limit || 0,
                      avatar: selectedCustomer.avatar || '',
                    });
                    setIsCustomerModalOpen(true);
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 12px',
                    background: '#0d5c75',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                  onClick={handleExportA4PDF}
                >
                  📥 Export A4 PDF
                </button>

                {/* ARCHIVE / REACTIVATE TOGGLE WITH BALANCE GUARD */}
                {currentUser?.role === 'ADMIN' && (
                  <button
                    className="btn"
                    disabled={
                      selectedCustomer.balance > 0 &&
                      selectedCustomer.is_active === 1
                    }
                    title={
                      selectedCustomer.balance > 0 &&
                      selectedCustomer.is_active === 1
                        ? 'Cannot archive party while debt balance is due.'
                        : 'Archive / Reactivate Party'
                    }
                    style={{
                      fontSize: '0.72rem',
                      padding: '6px 10px',
                      background:
                        selectedCustomer.balance > 0 &&
                        selectedCustomer.is_active === 1
                          ? '#f1f5f9'
                          : selectedCustomer.is_active === 1
                            ? '#fef3c7'
                            : '#dcfce7',
                      color:
                        selectedCustomer.balance > 0 &&
                        selectedCustomer.is_active === 1
                          ? '#94a3b8'
                          : selectedCustomer.is_active === 1
                            ? '#d97706'
                            : '#15803d',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor:
                        selectedCustomer.balance > 0 &&
                        selectedCustomer.is_active === 1
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                    onClick={() =>
                      handleToggleArchiveCustomer(selectedCustomer)
                    }
                  >
                    {selectedCustomer.is_active === 1
                      ? '📦 Archive'
                      : '🔄 Reactivate'}
                  </button>
                )}
              </div>
            </div>

            {/* ADVANCED FILTER TOOLBAR (Date range + description search) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: '#f8fafc',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Filter notes / description..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="input-field"
                style={{
                  flex: 1,
                  margin: 0,
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#64748b',
                }}
              >
                <span>From:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                />
                <span>To:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>
              {(filterStartDate || filterEndDate || ledgerSearch) && (
                <button
                  className="btn"
                  style={{
                    fontSize: '0.68rem',
                    padding: '4px 6px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    fontWeight: 'bold',
                  }}
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setLedgerSearch('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* TRANSACTIONS TABLE */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 2fr 1fr 1fr 1fr',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  background: '#f3efef',
                  padding: '8px',
                  borderRadius: '4px',
                  borderBottom: '1px solid #cbd5e0',
                  background: 'navy',
                }}
              >
                <span>TIMESTAMP</span>
                <span>DESCRIPTION / NOTES</span>
                <span style={{ textAlign: 'right' }}>DEBIT (+)</span>
                <span style={{ textAlign: 'right' }}>CREDIT (-)</span>
                <span style={{ textAlign: 'right' }}>BALANCE</span>
              </div>

              {filteredLedger.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    padding: '40px 0',
                    fontSize: '0.75rem',
                  }}
                >
                  No ledger entries matching your filters.
                </div>
              ) : (
                filteredLedger.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.3fr 2fr 1fr 1fr 1fr',
                      fontSize: '0.74rem',
                      alignItems: 'center',
                      background: '#fff',
                      padding: '7px 8px',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {entry.date}
                    </span>
                    <span style={{ color: '#334155' }}>
                      {entry.description}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        color: entry.debit > 0 ? '#dc2626' : '#94a3b8',
                        fontWeight: entry.debit > 0 ? 'bold' : 'normal',
                      }}
                    >
                      {entry.debit > 0
                        ? `Rs. ${entry.debit.toLocaleString()}`
                        : '—'}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        color: entry.credit > 0 ? '#059669' : '#94a3b8',
                        fontWeight: entry.credit > 0 ? 'bold' : 'normal',
                      }}
                    >
                      {entry.credit > 0
                        ? `Rs. ${entry.credit.toLocaleString()}`
                        : '—'}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#0d5c75',
                      }}
                    >
                      Rs. {entry.balance_after?.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '2px solid #e2e8f0',
                paddingTop: '10px',
                marginTop: '8px',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Account ID: #{selectedCustomer.id}
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                }}
              >
                Net Balance Due:{' '}
                <span
                  className="monospace"
                  style={{
                    color: selectedCustomer.balance > 0 ? '#dc2626' : '#059669',
                  }}
                >
                  Rs. {selectedCustomer.balance?.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{ textAlign: 'center', color: '#a0aec0', margin: 'auto' }}
          >
            <h4>
              👈 Select a party profile from the directory to view statement.
            </h4>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🛠️ MODALS                                   */}
      {/* ========================================== */}

      {/* REGISTER / EDIT PARTY MODAL WITH AVATAR */}
      {isCustomerModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '400px',
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#0d5c75' }}>
              {editingCustomer
                ? '✏️ Edit Party Profile'
                : '+ Register New Party'}
            </h3>
            <form
              onSubmit={handleSaveCustomer}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                {customerForm.avatar ? (
                  <img
                    src={customerForm.avatar}
                    alt="Preview"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: '#475569',
                    }}
                  >
                    No Pic
                  </div>
                )}
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: '#475569',
                    }}
                  >
                    Party Avatar / Badge
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ fontSize: '0.7rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              <input
                type="text"
                className="input-field"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                placeholder="Party Full Name*"
                required
              />
              <input
                type="text"
                className="input-field"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, phone: e.target.value })
                }
                placeholder="Phone Number"
              />
              <div>
                <label style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Credit Limit (Rs.) [0 for unlimited]
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={customerForm.credit_limit}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#0d5c75', fontWeight: 'bold' }}
                >
                  {editingCustomer ? 'Update Party' : 'Save Party'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsCustomerModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE CASH MODAL */}
      {isPaymentModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '380px',
              background: '#fff',
              padding: '18px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>
              💵 Receive Cash Payment
            </h3>
            <form
              onSubmit={handleRecordPayment}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount (Rs.)"
                required
              />
              <select
                className="input-field"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash Counter</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
              </select>
              <input
                type="text"
                className="input-field"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Notes / Reference"
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{
                    flex: 1,
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  Confirm Payment
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEBT MODAL */}
      {isDebtModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '380px',
              background: '#fff',
              padding: '18px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>
              + Add Debt (Debit Entry)
            </h3>
            <form
              onSubmit={handleAddDebt}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="Debt Amount (Rs.)"
                required
              />
              <input
                type="text"
                className="input-field"
                value={debtNotes}
                onChange={(e) => setDebtNotes(e.target.value)}
                placeholder="Reason / Particulars"
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: '#dc2626',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  Add Debt
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsDebtModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CREDIT / DISCOUNT MODAL */}
      {isCreditModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: '380px',
              background: '#fff',
              padding: '18px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#0284c7' }}>
              + Add Credit / Discount Adjustment
            </h3>
            <form
              onSubmit={handleAddCreditAdjustment}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Credit / Discount Amount (Rs.)"
                required
              />
              <input
                type="text"
                className="input-field"
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder="Reason (e.g. Special Discount / Return)"
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  Apply Credit
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#cbd5e0' }}
                  onClick={() => setIsCreditModalOpen(false)}
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
