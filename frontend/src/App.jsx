import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/public/LandingPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { clearAuthSession, getStoredUser, saveAuthSession } from './utils/authStorage';
import { clearAccessToken, refreshAccessToken, setAccessToken } from './utils/api';
import { AppLayout } from './app/AppLayout';
import { AppPageRenderer } from './app/AppPageRenderer';
import { resolveUserDisplayName, resolveUserRole } from './app/roleConstants';
import { LoadingState } from './components/common/LoadingState';
import { getDefaultPageForRole, normalizePageForRole } from './app/pageConfig';
import {
  buildAppPath,
  buildDetailRouteParams,
  getRequestRegistrationId,
  getRouteLhuNumber,
  getRouteAdminPermohonanRegistrationId,
  getRouteKasiPermohonanRegistrationId,
  getRouteStatusRegistrationId,
  parseDirectAppLink,
  parseRoute,
} from './app/routeUtils';
import { authApi } from './api/authApi';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = useMemo(() => parseRoute(location.pathname), [location.pathname]);
  const selectedStatusRegistrationId = useMemo(() => getRouteStatusRegistrationId(route), [route]);
  const selectedAdminPermohonanRegistrationId = useMemo(() => getRouteAdminPermohonanRegistrationId(route), [route]);
  const selectedKasiPermohonanRegistrationId = useMemo(() => getRouteKasiPermohonanRegistrationId(route), [route]);
  const selectedQcLhuNumber = useMemo(() => getRouteLhuNumber(route, 'qc'), [route]);
  const selectedKalabLhuNumber = useMemo(() => getRouteLhuNumber(route, 'kalab'), [route]);
  const directAppLink = useMemo(() => parseDirectAppLink(location.search, route), [location.search, route]);
  const paymentReturnInfo = useMemo(() => {
    if (route.kind !== 'app') return null;

    const params = new URLSearchParams(location.search);
    const payment = params.get('payment') || '';
    const idRegistrasi = params.get('id_registrasi') || '';
    const idInvoice = params.get('id_invoice') || '';
    const idPayment = params.get('id_payment') || '';
    const gatewayStatus = params.get('gateway_status') || '';

    if (!payment && !idRegistrasi && !idInvoice && !idPayment && !gatewayStatus) {
      return null;
    }

    return {
      payment,
      idRegistrasi,
      idInvoice,
      idPayment,
      gatewayStatus,
      key: [payment, idRegistrasi, idInvoice, idPayment, gatewayStatus].join('|'),
    };
  }, [location.search, route.kind]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState('pelanggan');
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [appPage, setAppPage] = useState('landing');
  const [userName, setUserName] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedPenugasanDetailId, setSelectedPenugasanDetailId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [selectedAnalisAssignmentId, setSelectedAnalisAssignmentId] = useState(null);
  const suppressDirectAppLinkRef = useRef(false);
  const returnToStorageKey = 'silabling_return_to';

  const resetDetailState = useCallback((nextPage = '') => {
    setSelectedRequest(null);


    if (nextPage !== 'detail-penugasan') {
      setSelectedAssignmentId(null);
    }

    if (nextPage !== 'detail_sampel') {
      setSelectedPenugasanDetailId(null);
    }

    if (!['sampel', 'detail_sampel'].includes(nextPage)) {
      setSelectedAnalisAssignmentId(null);
    }
  }, []);

  const resetAuthState = useCallback(() => {
    clearAccessToken();
    window.sessionStorage.removeItem('silabling_return_to');
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('pelanggan');
    setAuthToken('');
    setUserData(null);
    setShowRegister(false);
    setCurrentPage('dashboard');
    setAppPage('landing');
    setSelectedRequest(null);
    setShowLogoutModal(false);
    setSelectedPenugasanDetailId(null);
    setSelectedAssignmentId(null);
    setSelectedAnalisAssignmentId(null);
  }, []);

  const applyAuthState = useCallback((token, user, preferredPage = null) => {
    const resolvedRole = resolveUserRole(user);
    const nextPage = normalizePageForRole(
      resolvedRole,
      preferredPage || getDefaultPageForRole(resolvedRole)
    );

    setAuthToken(token);
    setUserData(user);
    setIsLoggedIn(true);
    setUserName(resolveUserDisplayName(user));
    setUserRole(resolvedRole);
    setCurrentPage(nextPage);
    setAppPage('dashboard');

    return { role: resolvedRole, page: nextPage };
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = getStoredUser();

      try {
        const refreshed = await refreshAccessToken();

        if (!refreshed?.token || !refreshed?.user) {
          clearAuthSession();
          resetAuthState();
          return;
        }

        const mergedUser = {
          ...(storedUser || {}),
          ...refreshed.user,
          idRole: refreshed.user.idRole || refreshed.user.id_role || storedUser?.idRole || storedUser?.id_role,
          id_role: refreshed.user.idRole || refreshed.user.id_role || storedUser?.idRole || storedUser?.id_role,
        };

        const resolvedRole = resolveUserRole(mergedUser);
        const preferredPage = directAppLink?.role === resolvedRole
          ? normalizePageForRole(resolvedRole, directAppLink.page || getDefaultPageForRole(resolvedRole))
          : route.kind === 'app'
            ? normalizePageForRole(resolvedRole, route.page || getDefaultPageForRole(resolvedRole))
            : getDefaultPageForRole(resolvedRole);

        saveAuthSession(mergedUser);
        const next = applyAuthState(refreshed.token, mergedUser, preferredPage);

        if (directAppLink?.role === resolvedRole) {
          if (directAppLink.idPenugasanDetail) {
            setSelectedPenugasanDetailId(directAppLink.idPenugasanDetail);
          }

          if (directAppLink.idPenugasan) {
            if (resolvedRole === 'analis') setSelectedAnalisAssignmentId(directAppLink.idPenugasan);
            if (resolvedRole === 'penyelia') setSelectedAssignmentId(directAppLink.idPenugasan);
          }
        }

        if (route.kind !== 'app') {
          navigate(buildAppPath(next.role, next.page, directAppLink?.role === next.role ? buildDetailRouteParams(directAppLink) : null), { replace: true });
        }
      } catch {
        clearAuthSession();
        resetAuthState();
      } finally {
        setAuthReady(true);
      }
    };

    restoreSession();
    // restoreSession hanya dijalankan saat mount. Route awal dibaca dari closure pertama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!isLoggedIn) {
      if (route.kind === 'app') {
        window.sessionStorage.setItem(returnToStorageKey, `${location.pathname}${location.search}`);
        navigate('/login', { replace: true });
        return;
      }

      if (route.kind === 'register') {
        setAppPage('register');
        setShowRegister(true);
        return;
      }

      if (route.kind === 'login') {
        setAppPage('login');
        setShowRegister(false);
        return;
      }

      if (route.kind === 'reset-password') return;

      setAppPage('landing');
      setShowRegister(false);
      return;
    }

    if (suppressDirectAppLinkRef.current) {
      suppressDirectAppLinkRef.current = false;
      return;
    }

    if (directAppLink?.role === userRole) {
      const nextPage = normalizePageForRole(userRole, directAppLink.page || getDefaultPageForRole(userRole));

      if (directAppLink.idPenugasanDetail) {
        setSelectedPenugasanDetailId(directAppLink.idPenugasanDetail);
      }

      if (directAppLink.idPenugasan) {
        if (userRole === 'analis') setSelectedAnalisAssignmentId(directAppLink.idPenugasan);
        if (userRole === 'penyelia') setSelectedAssignmentId(directAppLink.idPenugasan);
      }

      setAppPage('dashboard');
      setShowRegister(false);
      setCurrentPage(nextPage);
      navigate(buildAppPath(userRole, nextPage, buildDetailRouteParams(directAppLink)), { replace: true });
      return;
    }

    if (route.kind === 'app') {
      const nextPage = normalizePageForRole(userRole, route.page || getDefaultPageForRole(userRole));
      setAppPage('dashboard');
      setShowRegister(false);

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
        resetDetailState(nextPage);
      }

      const statusRegistrationId =
        userRole === 'pelanggan' && nextPage === 'status'
          ? getRouteStatusRegistrationId(route)
          : '';
      const adminPermohonanRegistrationId =
        ['admin', 'psp'].includes(userRole) && nextPage === 'permohonan'
          ? getRouteAdminPermohonanRegistrationId(route)
          : '';
      const kasiPermohonanRegistrationId =
        userRole === 'kasi' && nextPage === 'permohonan'
          ? getRouteKasiPermohonanRegistrationId(route)
          : '';
      const qcLhuNumber = userRole === 'qc' && nextPage === 'verifikasi'
        ? getRouteLhuNumber(route, 'qc')
        : '';
      const kalabLhuNumber = userRole === 'kalab' && nextPage === 'lhu'
        ? getRouteLhuNumber(route, 'kalab')
        : '';
      const expectedPathSegments = statusRegistrationId
        ? [statusRegistrationId]
        : adminPermohonanRegistrationId
          ? [adminPermohonanRegistrationId]
          : kasiPermohonanRegistrationId
            ? [kasiPermohonanRegistrationId]
            : qcLhuNumber
              ? [qcLhuNumber]
              : kalabLhuNumber
                ? [kalabLhuNumber]
                : [];
      const expectedPath = buildAppPath(
        userRole,
        nextPage,
        null,
        expectedPathSegments
      );
      if (location.pathname !== expectedPath) {
        navigate(expectedPath, { replace: true });
      }
      return;
    }

    if (route.kind !== 'reset-password') {
      const nextPage = currentPage || getDefaultPageForRole(userRole);
      navigate(buildAppPath(userRole, nextPage), { replace: true });
    }
  }, [authReady, currentPage, directAppLink, isLoggedIn, location.pathname, location.search, navigate, resetDetailState, route, userRole]);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !paymentReturnInfo) return;
    if (userRole !== 'pelanggan') return;

    const routePage = route.kind === 'app'
      ? normalizePageForRole(userRole, route.page || getDefaultPageForRole(userRole))
      : currentPage;

    if (routePage === 'status') {
      setSelectedRequest(null);
    }
  }, [authReady, currentPage, isLoggedIn, paymentReturnInfo, route.kind, route.page, userRole]);

  const clearPaymentReturnQuery = useCallback(() => {
    if (!paymentReturnInfo) return;

    const registrationId = String(paymentReturnInfo.idRegistrasi || '').trim();
    navigate(
      buildAppPath(userRole, 'status', null, registrationId ? [registrationId] : []),
      { replace: true }
    );
  }, [navigate, paymentReturnInfo, userRole]);

  const navigateToPage = useCallback((page, options = null) => {
    const nextPage = normalizePageForRole(userRole, page);
    const queryParams = options?.queryParams || options?.params || null;
    const pathSegments = options?.pathSegments || options?.segments || [];
    const shouldReplace = Boolean(options?.replace);

    // Navigasi dari sidebar/tombol internal harus mengabaikan direct-link lama.
    // Tanpa ini, URL detail lama seperti /penyelia/detail-penugasan?idPenugasan=...
    // bisa menarik user kembali ke detail saat klik menu Pengujian Sampel.
    suppressDirectAppLinkRef.current = true;

    setCurrentPage(nextPage);
    resetDetailState(nextPage);
    navigate(buildAppPath(userRole, nextPage, queryParams, pathSegments), { replace: shouldReplace });
  }, [navigate, resetDetailState, userRole]);

  const handleLogin = (token, user) => {
    setAccessToken(token);
    saveAuthSession(user);
    const next = applyAuthState(token, user);
    const returnTo = window.sessionStorage.getItem(returnToStorageKey) || '';

    if (returnTo) {
      const pendingUrl = new URL(returnTo, window.location.origin);
      const pendingRoute = parseRoute(pendingUrl.pathname);

      if (pendingRoute.kind === 'app' && pendingRoute.role === next.role) {
        window.sessionStorage.removeItem(returnToStorageKey);
        navigate(`${pendingUrl.pathname}${pendingUrl.search}`, { replace: true });
        return;
      }

      window.sessionStorage.removeItem(returnToStorageKey);
    }

    navigate(buildAppPath(next.role, next.page), { replace: true });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Sesi lokal tetap dibersihkan walaupun endpoint logout gagal.
    }

    clearAuthSession();
    resetAuthState();
    navigate('/', { replace: true });
  };

  const handleRegister = (token, user) => {
    setAccessToken(token);
    saveAuthSession(user);
    const next = applyAuthState(token, user);
    setShowRegister(false);
    navigate(buildAppPath(next.role, next.page), { replace: true });
  };

  const handleSessionExpired = useCallback(() => {
    clearAuthSession();
    clearAccessToken();
    resetAuthState();
    navigate('/login', { replace: true });
  }, [navigate, resetAuthState]);

  const handleRegistrationSubmit = () => {
    setSelectedRequest(null);
    navigateToPage('status');
  };

  const handleViewDetail = (request) => {
    const registrationId = getRequestRegistrationId(request);
    setSelectedRequest(request);

    if (userRole === 'pelanggan' && registrationId) {
      navigate(buildAppPath('pelanggan', 'status', null, [registrationId]));
    }
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    navigate(buildAppPath(userRole, 'status'));
  };


  const handleNavigate = (page) => {
    if (page === 'landing') {
      setAppPage('landing');
      setIsLoggedIn(false);
      navigate('/');
      return;
    }

    if (page === 'login') {
      setAppPage('login');
      setShowRegister(false);
      navigate('/login');
      return;
    }

    if (page === 'register') {
      setAppPage('register');
      setShowRegister(true);
      navigate('/register');
      return;
    }

    if (page === 'dashboard') {
      if (isLoggedIn) {
        navigateToPage(getDefaultPageForRole(userRole));
      } else {
        setAppPage('login');
        navigate('/login');
      }
    }
  };

  const confirmLogout = () => setShowLogoutModal(true);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <LoadingState
          title="Memuat sesi..."
          description="Mengecek status login pengguna"
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (route.kind === 'reset-password') {
    return (
      <ResetPasswordPage
        onBackToLogin={() => {
          setAppPage('login');
          setShowRegister(false);
          setIsLoggedIn(false);
          navigate('/login', { replace: true });
        }}
      />
    );
  }

  if (appPage === 'landing' && !isLoggedIn) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (!isLoggedIn) {
    if (showRegister || appPage === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setAppPage('login');
            navigate('/login');
          }}
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setShowRegister(true);
          setAppPage('register');
          navigate('/register');
        }}
      />
    );
  }

  return (
    <AppLayout
      role={userRole}
      currentPage={currentPage}
      userName={userName}
      onNavigate={navigateToPage}
      onRequestLogout={confirmLogout}
      onConfirmLogout={handleLogout}
      showLogoutModal={showLogoutModal}
      onCloseLogoutModal={() => setShowLogoutModal(false)}
    >
      <AppPageRenderer
        userRole={userRole}
        currentPage={currentPage}
        setCurrentPage={navigateToPage}
        authToken={authToken}
        userName={userName}
        userData={userData}
        selectedRequest={selectedRequest}
        selectedStatusRegistrationId={selectedStatusRegistrationId}
        selectedAdminPermohonanRegistrationId={selectedAdminPermohonanRegistrationId}
        selectedKasiPermohonanRegistrationId={selectedKasiPermohonanRegistrationId}
        selectedQcLhuNumber={selectedQcLhuNumber}
        selectedKalabLhuNumber={selectedKalabLhuNumber}
        selectedPenugasanDetailId={selectedPenugasanDetailId || (directAppLink?.role === userRole ? directAppLink.idPenugasanDetail : null)}
        setSelectedPenugasanDetailId={setSelectedPenugasanDetailId}
        selectedAssignmentId={selectedAssignmentId || (directAppLink?.role === userRole ? directAppLink.idPenugasan : null)}
        setSelectedAssignmentId={setSelectedAssignmentId}
        selectedAnalisAssignmentId={selectedAnalisAssignmentId || (directAppLink?.role === userRole ? directAppLink.idPenugasan : null)}
        setSelectedAnalisAssignmentId={setSelectedAnalisAssignmentId}
        onRegistrationSubmit={handleRegistrationSubmit}
        onViewDetail={handleViewDetail}
        onBackToList={handleBackToList}
        onSessionExpired={handleSessionExpired}
        paymentReturnInfo={paymentReturnInfo}
        onPaymentReturnConsumed={clearPaymentReturnQuery}
      />
    </AppLayout>
  );
}
