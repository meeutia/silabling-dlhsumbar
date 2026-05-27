import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { adminPaymentAccountApi } from '../../api/adminPaymentAccountApi';
import { showError, showSuccess } from '../../utils/feedback';

const EMPTY_FORM = {
  namaBank: '',
  nomorRekening: '',
  namaPemilik: '',
  catatan: '',
  isActive: true,
  isPrimary: false,
};

function normalizeAccount(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    idRekening: row.idRekening || row.id_rekening || '',
    namaBank: row.namaBank || row.nama_bank || '',
    nomorRekening: row.nomorRekening || row.nomor_rekening || '',
    namaPemilik: row.namaPemilik || row.nama_pemilik || '',
    catatan: row.catatan || '',
    isActive: Boolean(row.isActive ?? row.is_active),
    isPrimary: Boolean(row.isPrimary ?? row.is_primary),
  };
}

function formatAccountNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function buildPayload(form) {
  return {
    namaBank: String(form.namaBank || '').trim(),
    nomorRekening: String(form.nomorRekening || '').replace(/\D/g, ''),
    namaPemilik: String(form.namaPemilik || '').trim(),
    catatan: String(form.catatan || '').trim(),
    isActive: Boolean(form.isActive),
    isPrimary: Boolean(form.isPrimary),
  };
}

export function AdminPaymentAccountsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await adminPaymentAccountApi.getAll();
      setRows(data.map(normalizeAccount));
    } catch (error) {
      showError(error?.message || 'Gagal memuat rekening pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => [
      row.namaBank,
      row.nomorRekening,
      row.namaPemilik,
      row.catatan,
    ].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [rows, search]);

  const openCreateModal = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setSelected(row);
    setForm({
      namaBank: row.namaBank || '',
      nomorRekening: row.nomorRekening || '',
      namaPemilik: row.namaPemilik || '',
      catatan: row.catatan || '',
      isActive: row.isActive,
      isPrimary: row.isPrimary,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setModalOpen(false);
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const setValue = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'isPrimary' && value ? { isActive: true } : {}),
      ...(key === 'isActive' && !value ? { isPrimary: false } : {}),
    }));
  };

  const validateForm = () => {
    const payload = buildPayload(form);

    if (!payload.namaBank) return 'Nama bank wajib diisi.';
    if (!payload.nomorRekening) return 'Nomor rekening wajib diisi.';
    if (payload.nomorRekening.length < 6) return 'Nomor rekening minimal 6 digit.';
    if (!payload.namaPemilik) return 'Nama pemilik rekening wajib diisi.';

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      showError(validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      const response = await adminPaymentAccountApi.save(buildPayload(form), selected);
      showSuccess(response?.message || (selected ? 'Rekening pembayaran berhasil diperbarui.' : 'Rekening pembayaran berhasil ditambahkan.'));
      closeModal();
      await loadRows();
    } catch (error) {
      showError(error?.message || 'Gagal menyimpan rekening pembayaran.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setActionLoading(true);
    try {
      const response = await adminPaymentAccountApi.delete(deleteTarget);
      showSuccess(response?.message || 'Rekening pembayaran berhasil dihapus.');
      setDeleteTarget(null);
      await loadRows();
    } catch (error) {
      showError(error?.message || 'Gagal menghapus rekening pembayaran.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-12 sm:px-6 lg:px-8 mb-4">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <WalletCards className="h-4 w-4" />
              Rekening Pembayaran
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Kelola Nomor Rekening</h1>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Tambah Rekening
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 md:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari bank, nomor rekening, nama pemilik, atau catatan..."
              className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat rekening pembayaran...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <WalletCards className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-900">Belum ada rekening yang cocok.</p>
            <p className="mt-1 text-sm text-gray-500">Tambahkan rekening agar pelanggan mendapat instruksi pembayaran yang jelas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Rekening</th>
                  <th className="px-6 py-3">Pemilik</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Catatan</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.idRekening} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <WalletCards className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{row.namaBank}</p>
                          <p className="mt-1 text-lg font-bold tracking-wide text-gray-900">{formatAccountNumber(row.nomorRekening)}</p>
                          <p className="mt-1 text-xs text-gray-500">ID: {row.idRekening}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.namaPemilik}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {row.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {row.isPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            Utama
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.catatan || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <AccountModal
          form={form}
          selected={selected}
          loading={actionLoading}
          onClose={closeModal}
          onSubmit={handleSubmit}
          setValue={setValue}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          loading={actionLoading}
          onCancel={() => !actionLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function AccountModal({ form, selected, loading, onClose, onSubmit, setValue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {selected ? 'Edit Rekening Pembayaran' : 'Tambah Rekening Pembayaran'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Rekening aktif utama akan tampil pada instruksi pembayaran pelanggan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 pr-3 sm:pr-4">
            <TextInput label="Nama Bank" value={form.namaBank} required placeholder="Contoh: Bank Nagari" onChange={(value) => setValue('namaBank', value)} />
            <TextInput
              label="Nomor Rekening"
              value={formatAccountNumber(form.nomorRekening)}
              required
              inputMode="numeric"
              placeholder="Contoh: 1234 5678 9012"
              onChange={(value) => setValue('nomorRekening', value.replace(/\D/g, '').slice(0, 50))}
            />
            <TextInput label="Nama Pemilik Rekening" value={form.namaPemilik} required placeholder="Contoh: UPTD Laboratorium Lingkungan DLH Sumbar" onChange={(value) => setValue('namaPemilik', value)} />

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Catatan Transfer</span>
              <textarea
                value={form.catatan}
                onChange={(event) => setValue('catatan', event.target.value)}
                rows={3}
                placeholder="Contoh: Pastikan nominal transfer sesuai total tagihan."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(event) => setValue('isActive', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Aktif</p>
                  <p className="mt-1 text-xs text-gray-500">Rekening aktif dapat dipilih sebagai tujuan transfer.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(form.isPrimary)}
                  onChange={(event) => setValue('isPrimary', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-amber-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Jadikan rekening utama</p>
                  <p className="mt-1 text-xs text-gray-600">Rekening utama tampil pertama di halaman pembayaran pelanggan.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {selected ? 'Simpan Perubahan' : 'Tambah Rekening'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, required = false, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        {...props}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

function DeleteModal({ target, loading, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 p-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Hapus rekening pembayaran?</h3>
          <p className="mt-2 text-sm text-gray-600">
            Rekening {target.namaBank} {formatAccountNumber(target.nomorRekening)} akan dihapus dari instruksi pembayaran.
          </p>
          {target.isPrimary && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Rekening ini adalah rekening utama. Sistem akan memilih rekening aktif lain sebagai rekening utama setelah data dihapus.
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentAccountsPage;
