import { ChevronDown, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { DashboardErrorBanner } from '../../common/DashboardWidgets';
import { EmptyState } from '../../common/EmptyState';
import { LoadingState } from '../../common/LoadingState';

function formatTariffLabel(value, fallback = '-', options = {}) {
  const { scaleSmallThousands = false } = options;
  const raw = String(value ?? '').trim();
  if (!raw || raw === '-') return fallback;
  if (/^Rp\s+/i.test(raw)) return raw.replace(/^Rp\s*/i, 'Rp ');

  const compact = raw.replace(/\s+/g, '');
  const hasSeparator = /[.,]/.test(compact);

  if (hasSeparator && /^\d{1,3}([.]\d{3})*(,\d+)?$/.test(compact)) {
    return `Rp ${compact.replace(/,\d+$/, '')}`;
  }

  let numeric = Number(compact.replace(/[^\d-]/g, ''));
  if (Number.isFinite(numeric) && numeric >= 0) {
    if (scaleSmallThousands && numeric > 0 && numeric < 1000) {
      numeric *= 1000;
    }

    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric)}`;
  }

  return `Rp ${raw}`;
}

export function PelangganWelcomeHeader({ userName, errorMessage }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Selamat datang, {userName}
        </h1>
        <p className="text-gray-600">
          Kelola pengujian laboratorium lingkungan Anda dengan mudah
        </p>
        <DashboardErrorBanner message={errorMessage} />
      </div>
    </div>
  );
}

export function PelangganStatsCards({ infoCards }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {infoCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="ml-4 flex flex-1 flex-col items-end">
                <h3 className="mb-1 text-sm text-gray-600">{card.title}</h3>
                <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
                <p className="mt-1 text-xs text-gray-500">{card.trend}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PelangganCreateRequestCta({ onNavigate }) {
  return (
    <div className="mb-8 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 shadow-lg md:p-8">
      <div className="flex items-center justify-between">
        <div className="text-white">
          <h2 className="mb-2 text-2xl font-semibold">Daftar Pengujian Baru</h2>
          <p className="mb-6 text-emerald-100">
            Mulai proses pendaftaran pengujian air dan limbah cair
          </p>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-emerald-700 shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Buat Pendaftaran Baru
          </button>
        </div>
        <div className="hidden lg:block">
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <FileText className="h-20 w-20 text-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PelangganTariffPreview({ tariffData }) {
  const [showMoreParams, setShowMoreParams] = useState(false);

  const selectedParameters = tariffData?.selectedParameters || [];
  const rowsToShow = showMoreParams ? selectedParameters : selectedParameters.slice(0, 12);
  const hasMoreParameters = selectedParameters.length > rowsToShow.length;
  const loading = Boolean(tariffData?.loadingInitial || tariffData?.loadingParameters);
  const sampleTypes = tariffData?.sampleTypes || [];
  const pickupTariffs = tariffData?.pickupTariffs || [];

  return (
    <div className="mb-8 mt-8 rounded-2xl bg-white p-6 text-emerald-900 shadow-xl md:p-8">
      <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold">Tarif Pengujian dan Pengambilan Sampel</h3>
              <p className="mt-1 text-sm text-emerald-800/80">
                Pilih jenis air untuk melihat kategori, parameter, metode, dan tarif pengujian terbaru.
              </p>
            </div>
            {loading ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Memuat tarif...
              </span>
            ) : null}
          </div>

          {tariffData?.errorMessage ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {tariffData.errorMessage}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap gap-3 pb-2">
            {sampleTypes.length === 0 ? (
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Jenis air belum tersedia
              </div>
            ) : (
              sampleTypes.map((sampleType) => (
                <button
                  key={sampleType.id}
                  type="button"
                  onClick={() => {
                    tariffData.setSelectedSampleTypeId(sampleType.id);
                    setShowMoreParams(false);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold leading-tight transition sm:text-sm ${
                    tariffData.selectedSampleTypeId === sampleType.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {sampleType.name}
                </button>
              ))
            )}
          </div>

          {loading && selectedParameters.length === 0 ? (
            <LoadingState
              title="Memuat tarif pengujian..."
              description="Mengambil referensi tarif dari server"
              className="bg-emerald-50/60"
            />
          ) : selectedParameters.length === 0 ? (
            <EmptyState
              title="Tarif belum tersedia"
              description="Belum ada referensi tarif untuk jenis air yang dipilih."
              className="bg-emerald-50/60"
            />
          ) : (
            <div className="max-w-[700px] overflow-x-auto rounded-xl border border-emerald-100">
              <table className="w-full table-auto text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/70">
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Kategori</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Parameter</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Metode</th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Tarif (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsToShow.map((param, idx) => (
                    <tr
                      key={`${param.idParameter || param.name}-${param.idMetodeParameter || idx}`}
                      className="border-b border-emerald-50 last:border-0"
                    >
                      <td className="px-3 py-2.5 align-top">{param.category || 'Parameter Uji'}</td>
                      <td className="px-3 py-2.5 align-top font-medium">{param.name || '-'}</td>
                      <td className="px-3 py-2.5 align-top">{param.method || param.metode || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold align-top">
                        {formatTariffLabel(param.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasMoreParameters || showMoreParams ? (
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowMoreParams((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <span>{showMoreParams ? 'Sembunyikan' : 'Lihat parameter lainnya'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showMoreParams ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="hidden md:block">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              {pickupTariffs.length === 0 ? (
                <div className="rounded-lg px-3 py-2 text-sm text-emerald-700">
                  Tarif pengambilan sampel belum tersedia.
                </div>
              ) : (
                pickupTariffs.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-lg">
                    <span className="leading-relaxed">{item.label}</span>
                    <span className="whitespace-nowrap font-semibold">
                      {formatTariffLabel(item.price, '-', { scaleSmallThousands: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PelangganRecentActivities({ loading, recentActivities, onNavigate }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h2>
        <button
          type="button"
          onClick={() => onNavigate('status')}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{activity.id}</p>
                <p className="text-sm text-gray-600">
                  {activity.type} • {activity.date}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${activity.statusColor}`}>
              {activity.status}
            </span>
          </div>
        ))}
      </div>

      {recentActivities.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-600">{loading ? 'Memuat aktivitas...' : 'Belum ada aktivitas'}</p>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Mengambil data dari server' : 'Mulai dengan mendaftar pengujian baru'}
          </p>
        </div>
      )}
    </div>
  );
}
