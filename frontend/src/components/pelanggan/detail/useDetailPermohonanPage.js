import { useEffect, useMemo, useRef, useState } from 'react';
import { customerRequestApi } from '../../../api/customerRequestApi';
import { showError, showSuccess } from '../../../utils/feedback';
import { buildApiFileUrl, pickFirstFileValue } from '../../../utils/secureFileUrl';
import { FPPL_STATUSES, normalizeFpplStatus } from '../../../utils/fpplStatus';
import {
  getOperationalTimeOptions,
  getTodayYmd,
  isBusinessDayYmd,
  validateOperationalTime,
} from '../../../utils/businessDays';
import {
  buildWhatsAppLink,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCustomerProfile,
  getDetailRegistrationDate,
  getDetailVerificationDate,
  getFpplNumber,
  getRequestSamples,
  mergeDetailRequestDates,
} from './detailPermohonanCore.js';
import {
  calculateInvoiceTotal,
  getInvoiceFromRequest,
  getInvoiceItemQty,
  getInvoiceItemSubtotal,
  getKasiPengujianNote,
  getMethodName,
  getParameterName,
  getParameterPrice,
  getRegBmLabel,
  getSampleParameterMethods,
  getSampleTypeName,
  hasMethodAndTariffDetermined,
  isInvoiceItemSubkontrak,
  isParameterSubkontrak,
  normalizeInvoiceForDetail,
} from './detailPermohonanBilling.js';
import {
  getLhuApprovalDate,
  getTestingFinishedDate,
} from './detailPermohonanSampleLhu.js';
import {
  getActiveScheduleFromRequest,
  getLhuPickupInfoFromRequest,
} from './detailPermohonanSchedule.js';
import { buildProgressSteps } from './detailPermohonanProgress.js';
import { buildDetailTimelineItems } from './detailPermohonanTimeline.js';

export function useDetailPermohonanPage(request) {
  const requestFallbackRef = useRef(mergeDetailRequestDates(request, null));
  const [requestData, setRequestData] = useState(() => requestFallbackRef.current);
  const [expandedSection, setExpandedSection] = useState('timeline');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('MANUAL_TRANSFER');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofError, setPaymentProofError] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [customerCancelModalOpen, setCustomerCancelModalOpen] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [scheduleChangeForm, setScheduleChangeForm] = useState({ jenisJadwal: 'SAMPEL', tanggalUsulan: '', jamUsulan: '', alasanPengajuan: '' });
  const [activeScheduleChangeType, setActiveScheduleChangeType] = useState('');
  const [scheduleChangeLoading, setScheduleChangeLoading] = useState(false);
  const [scheduleConfirmLoading, setScheduleConfirmLoading] = useState('');
  const [holidayDateSet, setHolidayDateSet] = useState(new Set());
  const [holidayNameByDate, setHolidayNameByDate] = useState({});
  const [adminContact, setAdminContact] = useState(null);
  const initialDetailFetchRef = useRef('');

  const pembayaranRef = useRef(null);
  const hasilRef = useRef(null);
  const timelineRef = useRef(null);
  const sampelRef = useRef(null);

  const operationalTimeOptions = useMemo(() => getOperationalTimeOptions(), []);

  useEffect(() => {
    requestFallbackRef.current = mergeDetailRequestDates(
      request,
      requestFallbackRef.current
    );

    setRequestData((previousRequest) =>
      mergeDetailRequestDates(requestFallbackRef.current, previousRequest)
    );
  }, [request]);

  useEffect(() => {
    const registrationId = String(
      request?.id_registrasi ||
        request?.idRegistrasi ||
        request?.nomorRegistrasi ||
        request?.registrationNumber ||
        request?.id ||
        ''
    ).trim();

    if (!registrationId || registrationId === '-') return;
    if (initialDetailFetchRef.current === registrationId) return;

    initialDetailFetchRef.current = registrationId;
    let mounted = true;
    setDetailRefreshing(true);

    customerRequestApi
      .getDetail(registrationId)
      .then((data) => {
        if (!mounted) return;
        setRequestData((previousRequest) =>
          mergeDetailRequestDates(data, previousRequest)
        );
      })
      .catch((error) => {
        if (!mounted) return;
        showError(error?.message || 'Gagal memuat detail permohonan.');
      })
      .finally(() => {
        if (!mounted) return;
        setDetailRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [request]);


  useEffect(() => {
    let mounted = true;

    customerRequestApi
      .getHolidays()
      .then((rows) => {
        if (!mounted) return;

        const nextSet = new Set();
        const nextNames = {};

        (Array.isArray(rows) ? rows : []).forEach((item) => {
          const date = item?.date || item?.tanggal || item?.tanggal_libur;
          if (!date) return;

          nextSet.add(String(date).slice(0, 10));
          nextNames[String(date).slice(0, 10)] = item?.nama || item?.nama_libur || 'Tanggal merah';
        });

        setHolidayDateSet(nextSet);
        setHolidayNameByDate(nextNames);
      })
      .catch(() => {
        if (!mounted) return;
        setHolidayDateSet(new Set());
        setHolidayNameByDate({});
      });

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    customerRequestApi
      .getAdminContact()
      .then((contact) => {
        if (!mounted) return;
        setAdminContact(contact || null);
      })
      .catch(() => {
        if (!mounted) return;
        setAdminContact(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const customerProfile = useMemo(
    () => getCustomerProfile(requestData),
    [requestData]
  );

  const requestSamples = useMemo(
    () => getRequestSamples(requestData),
    [requestData]
  );

  const sampleTypeList = useMemo(
    () => requestSamples.map(getSampleTypeName).join(', '),
    [requestSamples]
  );

  const parameterList = useMemo(
    () =>
      requestSamples.flatMap((requestSample) =>
        getSampleParameterMethods(requestSample).map((fpm) => ({
          nama: getParameterName(fpm),
          metode: getMethodName(fpm),
          harga: parseFloat(fpm?.tarif || 0),
        }))
      ),
    [requestSamples]
  );

  const normalizedRequest = useMemo(
    () => ({
      id: requestData?.id_registrasi || requestData?.id,
      nomorRegistrasi:
        requestData?.id_registrasi || requestData?.nomorRegistrasi || '-',
      nomorFppl: getFpplNumber(requestData),
      jenisSampel: sampleTypeList || requestData?.jenisSampel || '-',
      tanggalDaftar:
        getDetailRegistrationDate(requestData) ||
        getDetailRegistrationDate(request) ||
        getDetailRegistrationDate(requestFallbackRef.current),
      tanggalVerifikasi:
        getDetailVerificationDate(requestData) ||
        getDetailVerificationDate(request) ||
        getDetailVerificationDate(requestFallbackRef.current),
      status: normalizeFpplStatus(
        requestData?.status_fppl || requestData?.status
      ),
      invoice: normalizeInvoiceForDetail(getInvoiceFromRequest(requestData)),
      paymentMethods: requestData?.paymentMethods || [],
      rincianBiaya:
        normalizeInvoiceForDetail(getInvoiceFromRequest(requestData))?.rincian ||
        requestData?.rincianBiaya ||
        requestData?.rincian_biaya ||
        (parameterList.length > 0 || requestData?.jenis_pengambilan_sampel
          ? {
              parameters: parameterList,
              metodeSampling:
                requestData?.metodeSampling ||
                requestData?.metode_sampling ||
                requestData?.jenis_pengambilan_sampel ||
                requestData?.jenisPengambilanSampel ||
                '-',
              biayaSampling:
                Number(requestData?.biayaSampling ?? requestData?.biaya_sampling ?? 0) || 0,
            }
          : null),
      namaSampel: sampleTypeList || requestData?.namaSampel || '-',
      lokasi:
        requestData?.lokasi_pengambilan_sampel ||
        requestData?.lokasi ||
        customerProfile?.alamat ||
        '-',
      tanggalSelesai:
        getLhuApprovalDate(requestData) ||
        getTestingFinishedDate(requestData) ||
        requestData?.tanggal_selesai ||
        requestData?.tanggalSelesai ||
        null,
      catatanPenolakan:
        requestData?.catatan_penolakan || requestData?.catatanPenolakan || null,
    }),
    [requestData, request, sampleTypeList, parameterList, customerProfile]
  );

  const statusAktif = normalizeFpplStatus(normalizedRequest.status);
  const invoice = normalizedRequest.invoice;
  const paymentGateway = null;
  const payment = invoice?.payment || null;
  const paymentVerificationStatus = String(
    payment?.statusVerifikasi || payment?.status_verifikasi || ''
  ).trim();
  const isPaymentRejected = paymentVerificationStatus === 'Ditolak';
  const isGatewayExpired = false;
  const shouldCreateOrRefreshPayment = Boolean(!payment);
  const shouldShowGatewayPaymentPanel = Boolean(
    payment && !payment.isDeferredByAdmin && statusAktif === FPPL_STATUSES.MENUNGGU_PEMBAYARAN
  );
  const billing = invoice?.rincian ?? normalizedRequest.rincianBiaya;
  const availablePaymentMethod = normalizedRequest.paymentMethods?.[0]?.code || 'MANUAL_TRANSFER';

  const subtotalUji = Number(invoice?.subtotal_uji || invoice?.subtotalUji || 0);
  const subtotalPengambilan = Number(
    invoice?.subtotal_pengambilan || invoice?.subtotalPengambilan || 0
  );
  const totalInvoice = calculateInvoiceTotal(invoice);
  const invoiceFilePath = pickFirstFileValue(
    invoice?.fileInvoiceDownloadUrl,
    invoice?.file_invoice_download_url,
    invoice?.fileInvoiceSecureUrl,
    invoice?.file_invoice_secure_url,
    invoice?.fileInvoicePath,
    invoice?.file_invoice_path
  );

  const hasInvoice = Boolean(invoice);
  const canShowInvoice =
    hasInvoice &&
    [
      FPPL_STATUSES.MENUNGGU_PEMBAYARAN,
      FPPL_STATUSES.MENUNGGU_VERIFIKASI_PEMBAYARAN,
      FPPL_STATUSES.MENUNGGU_SAMPEL,
      FPPL_STATUSES.PROSES_PENGUJIAN,
      FPPL_STATUSES.SELESAI,
    ].includes(statusAktif);

  const isPaymentDoneOrContinued = [
    FPPL_STATUSES.MENUNGGU_SAMPEL,
    FPPL_STATUSES.PROSES_PENGUJIAN,
    FPPL_STATUSES.SELESAI,
  ].includes(statusAktif);

  const isWaitingPaymentVerification =
    statusAktif === FPPL_STATUSES.MENUNGGU_VERIFIKASI_PEMBAYARAN;

  useEffect(() => {
    setSelectedPaymentMethod(availablePaymentMethod || 'MANUAL_TRANSFER');
  }, [availablePaymentMethod]);

  useEffect(() => {
    switch (statusAktif) {
      case FPPL_STATUSES.MENUNGGU_PEMBAYARAN:
      case FPPL_STATUSES.MENUNGGU_VERIFIKASI_PEMBAYARAN:
        setExpandedSection('pembayaran');
        break;
      case FPPL_STATUSES.MENUNGGU_SAMPEL:
        setExpandedSection('sampel');
        break;
      case FPPL_STATUSES.PROSES_PENGUJIAN:
      case FPPL_STATUSES.SELESAI:
        setExpandedSection('timeline');
        break;
      default:
        setExpandedSection('timeline');
        break;
    }
  }, [statusAktif]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search || '');
    const section = String(params.get('section') || '').toLowerCase();
    const focus = String(params.get('focus') || window.location.hash.replace('#', '') || '').toLowerCase();

    const supportedFocus = ['lhu-pickup', 'sample-schedule-confirmation', 'lhu-schedule-confirmation'];

    if (section !== 'sampel' && !supportedFocus.includes(focus)) return;

    setExpandedSection('sampel');

    window.setTimeout(() => {
      const targetId = supportedFocus.includes(focus) ? focus : '';
      const target = targetId ? document.getElementById(targetId) : null;

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      sampelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  }, [requestData?.id_registrasi, requestData?.idRegistrasi]);

  const isAdminRejected = statusAktif === FPPL_STATUSES.DITOLAK_ADMIN;

  const isKasiRejected = statusAktif === FPPL_STATUSES.DITOLAK_KASI;

  const isCustomerRejected = statusAktif === FPPL_STATUSES.DIBATALKAN_PELANGGAN;

  const isKasiRevision = statusAktif === FPPL_STATUSES.REVISION;

  const cleanDecisionNote =
    normalizedRequest.catatanPenolakan?.replace(
      /\[(Admin|Kasi|Pelanggan|Penyelia)\]\s*/,
      ''
    ) || null;

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const refreshRequestDetail = async () => {
    setDetailRefreshing(true);

    try {
      const data = await customerRequestApi.getDetail(normalizedRequest.nomorRegistrasi);
      setRequestData((previousRequest) =>
        mergeDetailRequestDates(data, previousRequest)
      );
    } catch (error) {
      showError(error?.message || 'Gagal memuat ulang detail permohonan.');
    } finally {
      setDetailRefreshing(false);
    }
  };

  const handleSetujuInvoice = async () => {
    const methodCode = selectedPaymentMethod || availablePaymentMethod || 'MANUAL_TRANSFER';

    if (!methodCode) {
      showError('Pilih metode pembayaran terlebih dahulu.');
      return;
    }

    if (!invoice || Number(totalInvoice || 0) <= 0) {
      showError('Data invoice belum lengkap atau total tagihan belum valid.');
      return;
    }

    setPaymentActionLoading(true);

    try {
      await customerRequestApi.submitPaymentDecision(normalizedRequest.nomorRegistrasi, {
        action: 'approve',
        paymentMethodCode: methodCode,
      });

      await refreshRequestDetail();
      setExpandedSection('pembayaran');
      showSuccess('Invoice disetujui. Silakan upload bukti pembayaran.');

      setTimeout(() => {
        pembayaranRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
    } catch (error) {
      showError(error?.message || 'Gagal menghubungi server.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handlePaymentProofChange = (event) => {
    const file = event.target.files?.[0] || null;

    setPaymentProofError('');
    setPaymentProofFile(null);

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setPaymentProofError('Bukti pembayaran harus berupa JPG, PNG, WEBP, atau PDF.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      setPaymentProofError('Ukuran bukti pembayaran maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    setPaymentProofFile(file);
  };

  const handleConfirmPayment = async () => {
    if (!paymentProofFile) {
      setPaymentProofError('Upload bukti pembayaran terlebih dahulu sebelum klik Kirim Bukti Pembayaran.');
      return;
    }

    setPaymentActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('buktiBayar', paymentProofFile);

      await customerRequestApi.confirmPayment(normalizedRequest.nomorRegistrasi, formData);

      setPaymentProofFile(null);
      setPaymentProofError('');

      await refreshRequestDetail();
      setExpandedSection('pembayaran');
      showSuccess(isPaymentRejected
        ? 'Bukti pembayaran berhasil diupload ulang. Menunggu verifikasi admin.'
        : 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
    } catch (error) {
      showError(error?.message || 'Gagal mengirim bukti pembayaran.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleTidakSetujuInvoice = () => {
    setCustomerCancelModalOpen(true);
  };

  const handleCloseCustomerCancelModal = () => {
    if (paymentActionLoading) return;
    setCustomerCancelModalOpen(false);
  };

  const handleConfirmCustomerCancel = async () => {
    setPaymentActionLoading(true);

    try {
      await customerRequestApi.submitPaymentDecision(normalizedRequest.nomorRegistrasi, {
        action: 'reject',
      });

      setCustomerCancelModalOpen(false);
      await refreshRequestDetail();
      setExpandedSection('pembayaran');
      showSuccess('Permohonan berhasil dibatalkan.');
    } catch (error) {
      showError(error?.message || 'Gagal menghubungi server.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const buildAdminWhatsAppLink = () => {
    const adminPhoneNumber =
      adminContact?.whatsapp_number ||
      adminContact?.whatsappNumber ||
      adminContact?.no_wa ||
      '';

    const message = [
      `Halo ${adminContact?.nama_pegawai || 'Admin DLH'}, saya mengalami kendala terkait pembayaran permohonan.`,
      `No Registrasi: ${normalizedRequest.nomorRegistrasi}`,
      `Nama Instansi: ${customerProfile?.nama_instansi || '-'}`,
      `PIC: ${customerProfile?.pic || '-'}`,
      'Mohon bantuannya.',
    ].join('\n');

    return buildWhatsAppLink(adminPhoneNumber, message);
  };

  const handleChatAdmin = () => {
    const whatsappLink = buildAdminWhatsAppLink();

    if (!whatsappLink) {
      showError('Nomor WhatsApp admin belum diatur. Isi pegawai.no_wa untuk user dengan role Admin terlebih dahulu.');
      return;
    }

    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };



  const resetScheduleChangeFields = (jenisJadwal = scheduleChangeForm.jenisJadwal || 'SAMPEL') => {
    setScheduleChangeForm({
      jenisJadwal,
      tanggalUsulan: '',
      jamUsulan: '',
      alasanPengajuan: '',
    });
  };

  const handleOpenScheduleChangeForm = (jenisJadwal) => {
    const normalizedType = jenisJadwal === 'LHU' ? 'LHU' : 'SAMPEL';
    setActiveScheduleChangeType(normalizedType);
    resetScheduleChangeFields(normalizedType);
  };

  const handleCancelScheduleChangeForm = () => {
    setActiveScheduleChangeType('');
    resetScheduleChangeFields(scheduleChangeForm.jenisJadwal || 'SAMPEL');
  };

  const handleConfirmSchedule = async (jenisJadwal = 'SAMPEL') => {
    const normalizedType = jenisJadwal === 'LHU' ? 'LHU' : 'SAMPEL';
    const label = normalizedType === 'LHU' ? 'Jadwal pengambilan LHU' : 'Jadwal sampel';

    setScheduleConfirmLoading(normalizedType);

    try {
      await customerRequestApi.confirmSchedule(normalizedRequest.nomorRegistrasi, {
        jenisJadwal: normalizedType,
      });
      setActiveScheduleChangeType('');
      await refreshRequestDetail();
      setExpandedSection('sampel');
      showSuccess(`${label} disetujui. Tombol setuju dan atur ulang jadwal otomatis disembunyikan.`);
    } catch (error) {
      showError(error?.message || `Gagal menyetujui ${label.toLowerCase()}.`);
    } finally {
      setScheduleConfirmLoading('');
    }
  };


  const validateScheduleBusinessDate = (dateValue) => {
    if (!dateValue) return 'Tanggal usulan wajib diisi.';
    if (dateValue < getTodayYmd()) return 'Tanggal usulan tidak boleh sebelum hari ini.';

    if (!isBusinessDayYmd(dateValue, holidayDateSet)) {
      const day = new Date(`${dateValue}T00:00:00`).getDay();
      if (day === 0) return 'Tanggal usulan tidak boleh hari Minggu.';
      if (day === 6) return 'Tanggal usulan tidak boleh hari Sabtu.';
      return `Tanggal usulan tidak boleh tanggal merah${holidayNameByDate[dateValue] ? ` (${holidayNameByDate[dateValue]})` : ''}.`;
    }

    return '';
  };

  const validateScheduleBusinessTime = (timeValue) => {
    const timeCheck = validateOperationalTime(timeValue, 'Jam usulan');
    return timeCheck.valid ? '' : timeCheck.reason;
  };

  const handleScheduleChangeDateChange = (jenisJadwal, value) => {
    const businessDateError = validateScheduleBusinessDate(value);
    if (businessDateError) {
      showError(businessDateError);
      setScheduleChangeForm((previous) => ({ ...previous, jenisJadwal, tanggalUsulan: '' }));
      return;
    }

    setScheduleChangeForm((previous) => ({ ...previous, jenisJadwal, tanggalUsulan: value }));
  };

  const handleScheduleChangeTimeChange = (jenisJadwal, value) => {
    const businessTimeError = validateScheduleBusinessTime(value);
    if (businessTimeError) {
      showError(businessTimeError);
      setScheduleChangeForm((previous) => ({ ...previous, jenisJadwal, jamUsulan: '' }));
      return;
    }

    setScheduleChangeForm((previous) => ({ ...previous, jenisJadwal, jamUsulan: value }));
  };

  const handleScheduleChangeSubmit = async (event) => {
    event?.preventDefault?.();

    if (!scheduleChangeForm.tanggalUsulan || !scheduleChangeForm.jamUsulan || !scheduleChangeForm.alasanPengajuan.trim()) {
      showError('Tanggal, jam, dan alasan perubahan jadwal wajib diisi.');
      return;
    }

    const businessDateError = validateScheduleBusinessDate(scheduleChangeForm.tanggalUsulan);
    if (businessDateError) {
      showError(businessDateError);
      return;
    }

    const businessTimeError = validateScheduleBusinessTime(scheduleChangeForm.jamUsulan);
    if (businessTimeError) {
      showError(businessTimeError);
      return;
    }

    setScheduleChangeLoading(true);

    try {
      const effectiveJenisJadwal = scheduleChangeForm.jenisJadwal || activeScheduleChangeType || 'SAMPEL';

      await customerRequestApi.requestScheduleChange({
        idRegistrasi: normalizedRequest.nomorRegistrasi,
        jenisJadwal: effectiveJenisJadwal,
        tanggalUsulan: scheduleChangeForm.tanggalUsulan,
        jamUsulan: scheduleChangeForm.jamUsulan,
        alasanPengajuan: scheduleChangeForm.alasanPengajuan,
      });

      setScheduleChangeForm((previous) => ({
        ...previous,
        tanggalUsulan: '',
        jamUsulan: '',
        alasanPengajuan: '',
      }));
      setActiveScheduleChangeType('');
      await refreshRequestDetail();
      setExpandedSection('sampel');
      showSuccess('Pengajuan perubahan jadwal berhasil dikirim ke admin.');
    } catch (error) {
      showError(error?.message || 'Gagal mengirim pengajuan perubahan jadwal.');
    } finally {
      setScheduleChangeLoading(false);
    }
  };

  const handleLihatInvoice = async () => {
    try {
      if (invoiceFilePath) {
        window.open(buildApiFileUrl(invoiceFilePath), '_blank', 'noopener,noreferrer');
        return;
      }

      const blob = await customerRequestApi.getInvoicePdfBlob(normalizedRequest.nomorRegistrasi);
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank', 'noopener,noreferrer');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch (error) {
      showError(error.message || 'Gagal membuka invoice PDF.');
    }
  };

  const progressSteps = buildProgressSteps(statusAktif, requestData);
  const activeSchedule = getActiveScheduleFromRequest(requestData);
  const lhuPickupInfo = getLhuPickupInfoFromRequest(requestData);
  const officerWhatsAppLink = activeSchedule?.no_wa_pcc
    ? buildWhatsAppLink(
        activeSchedule.no_wa_pcc,
        `Halo ${activeSchedule.nama_pegawai_pcc || 'Petugas'}, saya ingin konfirmasi jadwal pengambilan sampel untuk FPPL ${normalizedRequest.nomorFppl || normalizedRequest.nomorRegistrasi}.`
      )
    : '';

  const hasDeterminedMethodTariff = hasMethodAndTariffDetermined(requestData);

  const canShowMethodTariffTimeline =
    hasDeterminedMethodTariff &&
    ![
      FPPL_STATUSES.MENUNGGU_VERIFIKASI,
      FPPL_STATUSES.MENUNGGU_PENENTUAN_PARAMETER,
      FPPL_STATUSES.REVISION,
      FPPL_STATUSES.DIBATALKAN,
      FPPL_STATUSES.DIBATALKAN_PELANGGAN,
      FPPL_STATUSES.DITOLAK_ADMIN,
      FPPL_STATUSES.DITOLAK_KASI,
      FPPL_STATUSES.DITOLAK_PENYELIA,
    ].includes(statusAktif);

  const canEditKasiRevision =
    isKasiRevision &&
    normalizedRequest.catatanPenolakan?.includes('[Kasi]');

  const isWaitingKasiReviewAfterRevision =
    statusAktif === FPPL_STATUSES.MENUNGGU_PENENTUAN_PARAMETER &&
    normalizedRequest.catatanPenolakan?.includes('[Kasi]');

  const shouldShowDecisionNote =
    Boolean(cleanDecisionNote) &&
    (
      isKasiRevision ||
      isWaitingKasiReviewAfterRevision ||
      [
        FPPL_STATUSES.DIBATALKAN,
        FPPL_STATUSES.DIBATALKAN_PELANGGAN,
        FPPL_STATUSES.DITOLAK_ADMIN,
        FPPL_STATUSES.DITOLAK_KASI,
        FPPL_STATUSES.DITOLAK_PENYELIA,
      ].includes(statusAktif)
    );

  const timelineItems = buildDetailTimelineItems({
    normalizedRequest,
    requestData,
    statusAktif,
    invoice,
    activeSchedule,
    cleanDecisionNote,
    isAdminRejected,
    isKasiRejected,
    isCustomerRejected,
    isKasiRevision,
    canShowMethodTariffTimeline,
  });

  return {
    activeSchedule,
    activeScheduleChangeType,
    adminContact,
    billing,
    canEditKasiRevision,
    canShowInvoice,
    cleanDecisionNote,
    customerProfile,
    customerCancelModalOpen,
    detailRefreshing,
    expandedSection,
    formatCurrency,
    formatDate,
    formatDateTime,
    getInvoiceItemQty,
    getInvoiceItemSubtotal,
    getKasiPengujianNote,
    getMethodName,
    getParameterName,
    getParameterPrice,
    getRegBmLabel,
    getSampleParameterMethods,
    getSampleTypeName,
    handleChatAdmin,
    handleOpenScheduleChangeForm,
    handleConfirmSchedule,
    handleCancelScheduleChangeForm,
    handleConfirmPayment,
    handleConfirmCustomerCancel,
    handleLihatInvoice,
    handlePaymentProofChange,
    handleSetujuInvoice,
    handleScheduleChangeSubmit,
    handleTidakSetujuInvoice,
    handleCloseCustomerCancelModal,
    hasilRef,
    invoice,
    isAdminRejected,
    isInvoiceItemSubkontrak,
    isParameterSubkontrak,
    isPaymentDoneOrContinued,
    lhuPickupInfo,
    minScheduleDate: getTodayYmd(),
    isWaitingKasiReviewAfterRevision,
    isWaitingPaymentVerification,
    normalizedRequest,
    officerWhatsAppLink,
    paymentActionLoading,
    paymentGateway,
    paymentProofError,
    paymentProofFile,
    isGatewayExpired,
    isPaymentRejected,
    pembayaranRef,
    progressSteps,
    requestData,
    requestSamples,
    sampelRef,
    scheduleChangeForm,
    scheduleChangeLoading,
    scheduleConfirmLoading,
    selectedPaymentMethod,
    setScheduleChangeForm,
    handleScheduleChangeDateChange,
    handleScheduleChangeTimeChange,
    operationalTimeOptions,
    setSelectedPaymentMethod,
    shouldCreateOrRefreshPayment,
    shouldShowGatewayPaymentPanel,
    shouldShowDecisionNote,
    statusAktif,
    subtotalPengambilan,
    subtotalUji,
    timelineItems,
    timelineRef,
    toggleSection,
    totalInvoice,
  };
}
