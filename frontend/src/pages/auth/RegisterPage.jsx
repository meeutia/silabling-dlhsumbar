import { useState } from 'react';
import { User, Mail, Lock, FlaskConical, Droplets, Leaf, CreditCard, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/authApi';
  

export function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    nik: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nik = formData.nik.trim();
    const username = formData.username.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    const newErrors = {};

    if (!nik) {
      newErrors.nik = 'NIK wajib diisi';
    } else if (!/^\d{16}$/.test(nik)) {
      newErrors.nik = 'NIK harus 16 digit angka';
    }

    if (!username) {
      newErrors.username = 'Username wajib diisi';
    } else if (/\s/.test(username)) {
      newErrors.username = 'Username tidak boleh mengandung spasi';
    }

    if (!email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setApiError('');

    try {
      const data = await authApi.register({
        nik,
        username,
        email,
        password,
      });

      onRegister(data.data.token, data.data.user);
    } catch (err) {
      setApiError(err?.message || 'Tidak bisa menghubungi server.');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'nik') {
      newValue = value.replace(/\D/g, '').slice(0, 16);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (apiError) {
      setApiError('');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Illustration & Tagline */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 flex flex-col justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10">
              <Droplets className="w-32 h-32 text-white" />
            </div>
            <div className="absolute bottom-20 right-10">
              <Leaf className="w-24 h-24 text-white" />
            </div>
            <div className="absolute top-1/2 right-1/4">
              <FlaskConical className="w-20 h-20 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Lab Lingkungan</h1>
                <p className="text-emerald-100 text-sm">Sistem Informasi</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-white mb-4 leading-tight">
              Sistem Informasi Laboratorium Lingkungan
            </h2>

            <p className="text-emerald-100 text-lg mb-8">
              Bergabunglah untuk mengakses layanan pengujian kualitas air dan limbah cair yang profesional dan terpercaya.
            </p>

            {/* Features */}
            <div className="space-y-3">
              {[
                'Proses pendaftaran mudah dan cepat',
                'Monitoring pengujian real-time',
                'Laporan hasil uji tersertifikasi',
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

        {/* Right Side - Register Form */}
        <div className="p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Buat Akun</h2>
            <p className="text-gray-600 mb-8">Daftar untuk mengakses layanan pengujian</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* API Error Message */}
              {apiError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
                  {apiError}
                </div>
              )}

              {/* NIK */}
              <div>
                <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-2">
                  NIK (Nomor Induk Kependudukan)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="nik"
                    name="nik"
                    value={formData.nik}
                    onChange={handleChange}
                    required
                    maxLength={16}
                    className={`w-full pl-11 pr-4 py-3 border ${errors.nik ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                    placeholder="16 digit NIK"
                  />
                </div>
                {errors.nik && (
                  <p className="mt-1 text-sm text-red-500">{errors.nik}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className={`w-full pl-11 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                    placeholder="Username akun"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>


              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Minimal 6 karakter"
                  />
                  <div
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Ulangi password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Buat Akun'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Sudah punya akun?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Masuk
                </button>
              </p>
            </div>

            {/* Security Note */}
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
    </div>
  );
}
