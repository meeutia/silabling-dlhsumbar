import { FileText, Mail, Phone } from 'lucide-react';
import LogoUptd from '../../assets/logo-uptd.png';

export function LandingFooter({ scrollToSection, onNavigate }) {
  return (
    <>
      {/* Footer */}
      <footer className="bg-emerald-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                <img
                  src={LogoUptd}
                  alt="Logo Provinsi Sumatera Barat"
                  className="w-10 h-10 object-contain"
                />                
                </div>
                <div>
                  <h3 className="font-bold text-lg">UPTD Laboratory Lingkungan</h3>
                  <p className="text-sm text-gray-300">Dinas Lingkungan Hidup Provinsi Sumbar</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Laboratorium Pengujian Lingkungan Terakreditasi untuk layanan pengujian air, tanah, udara, dan limbah dengan standar internasional ISO/IEC 17025:2017.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('tentang')} className="hover:text-white transition-colors">
                    Tentang Kami
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('layanan')} className="hover:text-white transition-colors">
                    Layanan
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('tarif')} className="hover:text-white transition-colors">
                    Tarif
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('sertifikasi')} className="hover:text-white transition-colors">
                    Sertifikasi
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('kontak')} className="hover:text-white transition-colors">
                    Kontak
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button className="hover:text-white transition-colors">Privacy Policy</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">Terms of Service</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">FAQ</button>
                </li>
                <li>
                  <button onClick={() => onNavigate('register')} className="hover:text-white transition-colors">
                    Registrasi Akun
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
                    Login
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-300 text-sm">
                © 2026 UPTD Laboratory Lingkungan - Dinas Lingkungan Hidup Provinsi Sumatera Barat. All rights reserved.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                  <Mail className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}
