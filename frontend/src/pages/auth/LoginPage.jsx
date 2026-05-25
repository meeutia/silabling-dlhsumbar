import { useState } from 'react';
import {
  FlaskConical,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  X,
  Loader2,
} from 'lucide-react';
import { authApi } from '../../api/authApi';

export function LoginPage({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const identifier = formData.identifier.trim();
    const password = formData.password;

    if (!identifier) {
      setError('Email/username wajib diisi.');
      return;
    }

    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(identifier, password);
      onLogin(data.data.token, data.data.user);
    } catch (err) {
      setError(err?.message || 'Tidak bisa menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    const email = forgotEmail.trim().toLowerCase();

    setForgotError('');
    setForgotSuccess('');

    if (!email) {
      setForgotError('Email wajib diisi.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setForgotError('Format email tidak valid.');
      return;
    }

    setForgotLoading(true);

    try {
      const data = await authApi.forgotPassword(email);

      setForgotSuccess(
        data.message ||
          'Jika email terdaftar, link reset kata sandi telah dikirim ke email tersebut.'
      );

      setForgotEmail('');
    } catch (err) {
      setForgotError(err?.message || 'Tidak bisa menghubungi server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    const identifier = formData.identifier.trim();

    setForgotEmail(identifier.includes('@') ? identifier : '');
    setForgotError('');
    setForgotSuccess('');
    setForgotOpen(true);
  };

  const closeForgotModal = () => {
    if (forgotLoading) return;

    setForgotOpen(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10">
              <FlaskConical className="w-32 h-32 text-white" />
            </div>
            <div className="absolute bottom-20 right-10">
              <UserCircle className="w-24 h-24 text-white" />
            </div>
            <div className="absolute top-1/2 right-1/4">
              <Mail className="w-20 h-20 text-white" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Lab Lingkungan
                </h1>
                <p className="text-emerald-100 text-sm">Sistem Informasi</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-white mb-4 leading-tight">
              Sistem Informasi Laboratorium Lingkungan
            </h2>

            <p className="text-emerald-100 text-lg mb-8">
              Platform terintegrasi untuk pendaftaran dan pemantauan pengujian
              kualitas air dan limbah cair secara transparan dan terpercaya.
            </p>

            <div className="space-y-3">
              {[
                'Pendaftaran pengujian online 24/7',
                'Tracking real-time status sampel',
                'Download LHU resmi terverifikasi',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Masuk
            </h2>
            <p className="text-gray-600 mb-8">
              Masuk ke akun Anda untuk melanjutkan
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email / Username
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="identifier"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="email, username"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end ">
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Lupa kata sandi?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Daftar
                </button>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-xs text-gray-600">
                  Data Anda dijaga sesuai standar keamanan pemerintah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Lupa Kata Sandi
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Masukkan email akun yang sudah terdaftar.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForgotModal}
                disabled={forgotLoading}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="px-6 py-5">
              {forgotError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {forgotSuccess}
                </div>
              )}

              <label
                htmlFor="forgotEmail"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Terdaftar
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(event) => {
                    setForgotEmail(event.target.value);
                    if (forgotError) setForgotError('');
                    if (forgotSuccess) setForgotSuccess('');
                  }}
                  placeholder="contoh@email.com"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                  disabled={forgotLoading}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForgotModal}
                  disabled={forgotLoading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {forgotLoading ? 'Mengirim...' : 'Iya, Kirim Link Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}