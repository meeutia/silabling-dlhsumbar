import { useEffect, useState } from 'react';
import { adminAccountApi } from '../../api/adminAccountApi';
import { ErrorState } from '../../components/common/ErrorState';
import { ToastNotification } from '../../components/common/ToastNotification';
import { buildQuery, getToggleValue, sortStaffByBackendRoleOrder } from './AdminKelolaAkun.helpers';
import { validatePasswordPolicy } from '../../utils/passwordPolicy';
import {
  Header,
  TabButton,
  FilterBar,
  StaffTable,
  CustomerTable,
} from './AdminKelolaAkunTables';
import {
  StaffFormModal,
  StaffDetailDrawer,
  CustomerDetailDrawer,
  ConfirmModal,
} from './AdminKelolaAkunModals';

export function AdminKelolaAkunPage() {
  const [activeTab, setActiveTab] = useState('staff');

  const [search, setSearch] = useState('');
  const [staffRole, setStaffRole] = useState('Semua');
  const [staffStatus, setStaffStatus] = useState('Semua');
  const [customerStatus, setCustomerStatus] = useState('Semua');

  const [staffRows, setStaffRows] = useState([]);
  const [customerRows, setCustomerRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);

  const staffCount = staffRows.length;
  const customerCount = customerRows.length;

  const showToast = (nextToast) => {
    setToast(nextToast);
  };

  const showModalError = (error, title = 'Data perlu dicek') => {
    const message = typeof error === 'string' ? error : (error?.message || 'Terjadi kesalahan.');
    setModalAlert({
      id: Date.now(),
      type: 'error',
      title,
      message,
    });
  };

  const handleError = (error) => {
    const message = error?.message || 'Terjadi kesalahan.';
    setErrorMessage(message);
    showToast({
      type: 'error',
      message,
    });
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setConfirmAction(null);
    setModalAlert(null);
  };

  const loadStaff = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const query = buildQuery({
        search,
        role: staffRole,
        status: staffStatus,
      });

      const json = await adminAccountApi.getStaff(query);
      const rows = json?.data?.staff || [];
      setStaffRows(Array.isArray(rows) ? sortStaffByBackendRoleOrder(rows) : []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const query = buildQuery({
        search,
        status: customerStatus,
      });

      const json = await adminAccountApi.getCustomers(query);
      const rows = json?.data?.customers || [];
      setCustomerRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffSummary = async () => {
    try {
      const json = await adminAccountApi.getStaff('');
      const rows = json?.data?.staff || [];
      setStaffRows(Array.isArray(rows) ? sortStaffByBackendRoleOrder(rows) : []);
    } catch {
      // Ringkasan tab lain tidak boleh mengganggu tab aktif.
    }
  };

  const loadCustomerSummary = async () => {
    try {
      const json = await adminAccountApi.getCustomers('');
      const rows = json?.data?.customers || [];
      setCustomerRows(Array.isArray(rows) ? rows : []);
    } catch {
      // Ringkasan tab lain tidak boleh mengganggu tab aktif.
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (activeTab === 'staff') {
        loadStaff();
        loadCustomerSummary();
      } else {
        loadCustomers();
        loadStaffSummary();
      }
    }, 250);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, staffRole, staffStatus, customerStatus]);

  const handleSubmitStaff = async (formData) => {
    const hasAccount = Boolean(formData.hasAccount);

    if (hasAccount && formData.passwordMode === 'manual') {
      const passwordError = validatePasswordPolicy(formData.password);

      if (passwordError) {
        showModalError(passwordError);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        showModalError('Konfirmasi password tidak sesuai.');
        return;
      }
    }

    setModalAlert(null);
    setActionLoading(true);

    try {
      const payload = {
        name: formData.name,
        jabatan: formData.jabatan,
        is_pcc: formData.isPcc ? 1 : 0,
        nip: formData.nip,
        phone: formData.phone,
        role: hasAccount ? formData.role : (formData.isPcc ? 'PPS' : ''),
        status: formData.status,
        hasAccount,
        passwordMode: formData.passwordMode,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      if (hasAccount) {
        payload.nik = formData.nik;
        payload.email = formData.email;
        payload.username = formData.username;
      }

      const json = await adminAccountApi.saveStaff(payload);

      showToast({
        type: 'success',
        message: json?.message || 'Akun petugas berhasil dibuat.',
        temporaryPassword: json?.data?.temporaryPassword || null,
      });

      closeModal();
      await loadStaff();
    } catch (error) {
      showModalError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setModalAlert(null);
    setActionLoading(true);

    try {
      const { type, target } = confirmAction;
      let json = null;

      if (type === 'reset-staff-password') {
        json = await adminAccountApi.resetStaffPassword(target.nik);
        await loadStaff();
      }

      if (type === 'toggle-staff-status') {
        json = await adminAccountApi.toggleStaffStatus(target.nik, getToggleValue(target));
        await loadStaff();
      }

      if (type === 'reset-customer-password') {
        const customerId = target.idPelanggan || target.id_pelanggan || target.id;

        json = await adminAccountApi.resetCustomerPassword(customerId);
        await loadCustomers();
      }

      if (type === 'toggle-customer-status') {
        const customerId = target.idPelanggan || target.id_pelanggan || target.id;

        json = await adminAccountApi.toggleCustomerStatus(customerId, getToggleValue(target));
        await loadCustomers();
      }

      showToast({
        type: 'success',
        message: json?.message || 'Aksi berhasil diproses.',
        temporaryPassword: json?.data?.temporaryPassword || null,
      });

      closeModal();
    } catch (error) {
      showModalError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openAddStaff = () => {
    setSelected(null);
    setModalAlert(null);
    setModal('staff-form');
  };


  const openConfirm = (type, target) => {
    setModalAlert(null);
    setConfirmAction({ type, target });
    setModal('confirm');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto">
        <Header
          activeTab={activeTab}
          onAddStaff={openAddStaff}
        />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="border-b border-gray-100 px-4 md:px-6">
            <div className="flex gap-6">
              <TabButton
                active={activeTab === 'staff'}
                label="Petugas"
                count={staffCount}
                onClick={() => setActiveTab('staff')}
              />
              <TabButton
                active={activeTab === 'customers'}
                label="Pelanggan"
                count={customerCount}
                onClick={() => setActiveTab('customers')}
              />
            </div>
          </div>

          <FilterBar
            activeTab={activeTab}
            search={search}
            setSearch={setSearch}
            staffRole={staffRole}
            setStaffRole={setStaffRole}
            staffStatus={staffStatus}
            setStaffStatus={setStaffStatus}
            customerStatus={customerStatus}
            setCustomerStatus={setCustomerStatus}
          />
        </div>

        {errorMessage && (
          <ErrorState
            message={errorMessage}
            className="mb-6"
          />
        )}

        {activeTab === 'staff' ? (
          <StaffTable
            rows={staffRows}
            loading={loading}
            onView={(row) => {
              setSelected(row);
              setModal('staff-detail');
            }}
          />
        ) : (
          <CustomerTable
            rows={customerRows}
            loading={loading}
            onView={(row) => {
              setSelected(row);
              setModal('customer-detail');
            }}
          />
        )}
      </div>

      {modal === 'staff-form' && (
        <StaffFormModal
          loading={actionLoading}
          onClose={closeModal}
          alert={modalAlert}
          onDismissAlert={() => setModalAlert(null)}
          onSubmit={handleSubmitStaff}
        />
      )}

      {modal === 'staff-detail' && selected && (
        <StaffDetailDrawer
          row={selected}
          onClose={closeModal}
          onResetPassword={() => openConfirm('reset-staff-password', selected)}
          onToggleStatus={() => openConfirm('toggle-staff-status', selected)}
        />
      )}

      {modal === 'customer-detail' && selected && (
        <CustomerDetailDrawer
          row={selected}
          onClose={closeModal}
          onResetPassword={() => openConfirm('reset-customer-password', selected)}
          onToggleStatus={() => openConfirm('toggle-customer-status', selected)}
        />
      )}

      {modal === 'confirm' && confirmAction && (
        <ConfirmModal
          action={confirmAction}
          loading={actionLoading}
          onClose={closeModal}
          alert={modalAlert}
          onDismissAlert={() => setModalAlert(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
