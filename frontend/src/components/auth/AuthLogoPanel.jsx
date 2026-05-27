// components/auth/AuthLogoPanel.jsx
import logoUptd from '../../assets/logo-uptd.png';
import logoSumbar from '../../assets/logo-sumbar.png';
import logoKan from '../../assets/kan-logo.png';

function InstitutionLogoCard({ src, alt, title, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
        <img src={src} alt={alt} className="max-h-12 max-w-12 object-contain" />
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-emerald-900">{title}</p>
      <p className="mt-1 text-center text-xs leading-relaxed text-gray-500">{subtitle}</p>
    </div>
  );
}

export function AuthLogoPanel() {
  return (
    <div className="relative flex min-h-[360px] flex-col overflow-hidden bg-emerald-500 p-12 text-white lg:min-h-full lg:p-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full border border-white/10" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="border-t border-white/20 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
            Dikelola oleh
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-white lg:text-[26px]">
            UPTD Laboratorium
            <span className="block">Lingkungan Hidup</span>
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <InstitutionLogoCard
            src={logoUptd}
            alt="Logo UPTD Laboratorium Lingkungan"
            title="UPTD"
            subtitle="Lab. Lingkungan"
          />
          <InstitutionLogoCard
            src={logoSumbar}
            alt="Logo Pemerintah Provinsi Sumatera Barat"
            title="Sumbar"
            subtitle="Pemprov Sumatera Barat"
          />
        </div>

        <div className="my-5 mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
            Terakreditasi
          </p>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 px-2 ring-1 ring-blue-100">
              <img src={logoKan} alt="Logo Komite Akreditasi Nasional" className="max-h-10 max-w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-900">Komite Akreditasi Nasional</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Lembaga Akreditasi Terakreditasi Resmi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
