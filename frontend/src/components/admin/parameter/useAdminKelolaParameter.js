import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminParameterApi } from '../../../api/adminParameterApi';
import { getToastDuration, getToastTitle, normalizeToastType } from '../../../utils/toastConfig';
import { getCurrencyDigits, normalizeBool, stripHtml, toCurrencyNumber } from './parameterFormatters';

const EMPTY_PAKET_PARAM_FORM = {
  id_parameter: '',
  nilai_bm: '',
  satuan_bm: '',
  ket_bm: '',
};

const DELETE_META = {
  param_metode: {
    title: 'Hapus Parameter & Metode',
    description: (item) => `${item.parameter?.nama_parameter || '-'} - ${item.metode?.nama_metode || '-'}`,
  },
  regulasi: {
    title: 'Hapus Regulasi',
    description: (item) => item.ref_reg || item.id_reg_bm,
  },
  paket: {
    title: 'Hapus Paket Baku Mutu',
    description: (item) => item.nama_pkt || item.id_pkt_bm,
  },
  paket_param: {
    title: 'Hapus Parameter dari Paket',
    description: (item) => item.parameter?.nama_parameter || item.id_pkt_bm_param,
  },
  tarif: {
    title: 'Hapus Tarif Pengambilan',
    description: (item) => item.keterangan_jarak || item.id_tarif_pengambilan,
  },
};

function getInitialFormData(type, item) {
  if (type === 'add_param_metode' || type === 'edit_param_metode') {
    return item
      ? {
          id_metode_parameter: item.id_metode_parameter,
          id_parameter: item.id_parameter || item.parameter?.id_parameter || '',
          id_metode: item.id_metode || item.metode?.id_metode || '',
          acuan_metode: item.acuan_metode || '',
          tarif: item.tarif != null ? String(item.tarif) : '',
          is_terakreditasi: normalizeBool(item.is_terakreditasi),
          is_subkontrak: normalizeBool(item.is_subkontrak),
          is_new_parameter: false,
          is_new_metode: false,
          nama_parameter: '',
          kategori_parameter: '',
          nama_metode: '',
        }
      : {
          id_parameter: '',
          id_metode: '',
          acuan_metode: '',
          tarif: '',
          is_terakreditasi: false,
          is_subkontrak: false,
          is_new_parameter: false,
          is_new_metode: false,
          nama_parameter: '',
          kategori_parameter: '',
          nama_metode: '',
        };
  }

  if (type === 'add_regulasi' || type === 'edit_regulasi') {
    return item
      ? {
          ...item,
          is_active: normalizeBool(item.is_active),
        }
      : {
          instansi: 'KEMENKES',
          ref_reg: '',
          is_active: true,
        };
  }

  if (type === 'add_paket' || type === 'edit_paket') {
    return item
      ? {
          ...item,
          id_reg_bm: item.id_reg_bm || item.reg_bm?.id_reg_bm || '',
          id_jenis_sampel: item.id_jenis_sampel || item.jenis_sampel?.id_jenis_sampel || '',
          is_active: normalizeBool(item.is_active),
        }
      : {
          id_reg_bm: '',
          id_jenis_sampel: '',
          nama_pkt: '',
          klasifikasi: '',
          teks_lhu: '',
          is_active: true,
        };
  }

  if (type === 'add_tarif' || type === 'edit_tarif') {
    return item
      ? { ...item, tarif: item.tarif != null ? String(item.tarif) : '' }
      : {
          keterangan_jarak: '',
          tarif: '',
        };
  }

  return {};
}

function validateParameterMetode(body) {
  if (body.is_new_parameter && !body.nama_parameter?.trim()) {
    throw new Error('Nama parameter baru harus diisi');
  }

  if (body.is_new_metode && !body.nama_metode?.trim()) {
    throw new Error('Nama metode baru harus diisi');
  }

  if (!body.is_new_parameter && !body.id_parameter) {
    throw new Error('Pilih parameter');
  }

  if (!body.is_new_metode && !body.id_metode) {
    throw new Error('Pilih metode');
  }

  if (toCurrencyNumber(body.tarif) <= 0) {
    throw new Error('Tarif harus diisi lebih dari 0.');
  }
}

function normalizeDuplicateText(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function normalizeDuplicateAcuan(value) {
  return normalizeDuplicateText(value || '');
}

function normalizeDuplicateFlag(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true' ? 1 : 0;
}

function getParameterName(parameter) {
  return stripHtml(parameter?.nama_parameter || parameter?.parameter?.nama_parameter || '');
}

function getMethodName(method) {
  return method?.nama_metode || method?.metode?.nama_metode || '';
}

function createDuplicateWarning(message) {
  const error = new Error(message);
  error.isDuplicateWarning = true;
  return error;
}

function buildDuplicateParameterMetodeWarning({
  body,
  selectedItem,
  parameterMetodeData,
  parametersOption,
  methodsOption,
}) {
  const namaParameterBaru = String(body.nama_parameter || '').trim();
  const namaMetodeBaru = String(body.nama_metode || '').trim();

  if (body.is_new_parameter && namaParameterBaru) {
    const existingParameter = parametersOption.find(
      (parameter) => normalizeDuplicateText(getParameterName(parameter)) === normalizeDuplicateText(namaParameterBaru)
    );

    if (existingParameter) {
      return `Parameter "${namaParameterBaru}" sudah ada. Matikan pilihan Buat Baru, lalu pilih parameter dari daftar.`;
    }
  }

  if (body.is_new_metode && namaMetodeBaru) {
    const existingMetode = methodsOption.find(
      (metode) => normalizeDuplicateText(getMethodName(metode)) === normalizeDuplicateText(namaMetodeBaru)
    );

    if (existingMetode) {
      return `Metode "${namaMetodeBaru}" sudah ada. Matikan pilihan Buat Baru, lalu pilih metode dari daftar.`;
    }
  }

  if (body.is_new_parameter || body.is_new_metode) {
    return '';
  }

  const idParameter = String(body.id_parameter || '');
  const idMetode = String(body.id_metode || '');
  const acuanMetode = normalizeDuplicateAcuan(body.acuan_metode);
  const isSubkontrak = normalizeDuplicateFlag(body.is_subkontrak);

  const duplicate = parameterMetodeData.find((item) => {
    if (selectedItem?.id_metode_parameter && item.id_metode_parameter === selectedItem.id_metode_parameter) {
      return false;
    }

    return (
      String(item.id_parameter || item.parameter?.id_parameter || '') === idParameter &&
      String(item.id_metode || item.metode?.id_metode || '') === idMetode &&
      normalizeDuplicateAcuan(item.acuan_metode) === acuanMetode &&
      normalizeDuplicateFlag(item.is_subkontrak) === isSubkontrak
    );
  });

  if (!duplicate) {
    return '';
  }

  const parameterName = getParameterName(duplicate) || parametersOption.find((item) => item.id_parameter === idParameter)?.nama_parameter || 'Parameter';
  const metodeName = getMethodName(duplicate) || methodsOption.find((item) => item.id_metode === idMetode)?.nama_metode || 'Metode';
  const acuanLabel = String(body.acuan_metode || '').trim();
  const labelParts = [stripHtml(parameterName), metodeName];

  if (acuanLabel) {
    labelParts.push(acuanLabel);
  }

  return `Data parameter metode sudah ada: ${labelParts.join(' - ')}${isSubkontrak ? ' (subkontrak)' : ''}.`;
}

function isDuplicateError(error) {
  return Boolean(
    error?.isDuplicateWarning ||
    error?.status === 409 ||
    error?.data?.code === 'DUPLICATE_MASTER_DATA' ||
    /sudah ada|duplikat/i.test(error?.message || '')
  );
}

function normalizeTarifBody(body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'tarif')) return body;
  return {
    ...body,
    tarif: toCurrencyNumber(body.tarif),
  };
}

async function saveByModalType(modalType, body, selectedItem) {
  if (modalType === 'add_param_metode' || modalType === 'edit_param_metode') {
    validateParameterMetode(body);
    return adminParameterApi.saveParameterMetode(body, selectedItem);
  }

  if (modalType === 'add_regulasi' || modalType === 'edit_regulasi') {
    return adminParameterApi.saveRegulasi(body, selectedItem);
  }

  if (modalType === 'add_paket' || modalType === 'edit_paket') {
    return adminParameterApi.savePaket(body, selectedItem);
  }

  if (modalType === 'add_tarif' || modalType === 'edit_tarif') {
    return adminParameterApi.saveTarifPengambilan(body, selectedItem);
  }

  throw new Error('Jenis form tidak valid.');
}

async function deleteByType(type, item) {
  if (type === 'param_metode') return adminParameterApi.deleteParameterMetode(item);
  if (type === 'regulasi') return adminParameterApi.deleteRegulasi(item);
  if (type === 'paket') return adminParameterApi.deletePaket(item);
  if (type === 'paket_param') return adminParameterApi.deletePaketParameter(item);
  if (type === 'tarif') return adminParameterApi.deleteTarifPengambilan(item);

  throw new Error('Jenis data tidak valid.');
}

export function useAdminKelolaParameter() {
  const [activeTab, setActiveTab] = useState('parameter_metode');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
    title: 'Berhasil',
  });

  const [modalAlert, setModalAlert] = useState({
    show: false,
    message: '',
    type: 'info',
    title: 'Perhatian',
    id: 0,
  });

  const [parameterMetodeData, setParameterMetodeData] = useState([]);
  const [regulasiData, setRegulasiData] = useState([]);
  const [paketData, setPaketData] = useState([]);
  const [paketParameters, setPaketParameters] = useState([]);
  const [tarifPengambilanData, setTarifPengambilanData] = useState([]);

  const [jenisSampelOptions, setJenisSampelOptions] = useState([]);
  const [parametersOption, setParametersOption] = useState([]);
  const [methodsOption, setMethodsOption] = useState([]);
  const [kategoriParameterOptions, setKategoriParameterOptions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [paketParamForm, setPaketParamForm] = useState(EMPTY_PAKET_PARAM_FORM);
  const [editingPaketParam, setEditingPaketParam] = useState(null);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success', title: 'Berhasil' });
  }, []);

  const hideModalAlert = useCallback(() => {
    setModalAlert({ show: false, message: '', type: 'info', title: 'Perhatian', id: 0 });
  }, []);

  const showModalAlert = useCallback((message, type = 'warning', options = {}) => {
    const normalizedType = normalizeToastType(type);
    setModalAlert({
      show: true,
      message,
      type: normalizedType,
      title: getToastTitle(normalizedType, options.title),
      id: Date.now(),
    });
  }, []);

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const normalizedType = normalizeToastType(type);
    const title = getToastTitle(normalizedType, options.title);
    const duration = getToastDuration(normalizedType, options.duration);

    setToast({
      show: true,
      message,
      type: normalizedType,
      title,
      duration,
      position: options.position,
    });

    setTimeout(() => {
      setToast((current) => {
        if (current.message !== message || current.type !== normalizedType) return current;
        return { show: false, message: '', type: 'success', title: 'Berhasil' };
      });
    }, duration);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (activeTab === 'parameter_metode') {
        const { parameterMetode, parameters, methods, kategoriParameters } = await adminParameterApi.getParameterMethodTabData();

        setParameterMetodeData(parameterMetode);
        setParametersOption(parameters);
        setMethodsOption(methods);
        setKategoriParameterOptions(kategoriParameters);
      }

      if (activeTab === 'regulasi') {
        const regulasi = await adminParameterApi.getRegulasi();
        setRegulasiData(regulasi);
      }

      if (activeTab === 'paket_baku_mutu') {
        const { paket, regulasi, jenisSampel, parameters } = await adminParameterApi.getPaketTabData();

        setPaketData(paket);
        setRegulasiData(regulasi);
        setJenisSampelOptions(jenisSampel);
        setParametersOption(parameters);
      }

      if (activeTab === 'tarif_pengambilan') {
        const tarifPengambilan = await adminParameterApi.getTarifPengambilan();
        setTarifPengambilanData(tarifPengambilan);
      }
    } catch (error) {
      showToast(error.message || 'Gagal memuat data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPaketParameters = useCallback(
    async (idPktBm) => {
      setIsModalLoading(true);

      try {
        const parameters = await adminParameterApi.getPaketParameters(idPktBm);
        setPaketParameters(parameters);
      } catch (error) {
        showToast(error.message || 'Gagal memuat parameter paket', 'error');
      } finally {
        setIsModalLoading(false);
      }
    },
    [showToast]
  );

  const handleChangeTab = useCallback((tabKey) => {
    setActiveTab(tabKey);
    setSearchQuery('');
    setFilterStatus('Semua');
  }, []);

  const handleOpenModal = useCallback((type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFormData(getInitialFormData(type, item));
    hideModalAlert();
    setIsModalOpen(true);
  }, [hideModalAlert]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
    hideModalAlert();
    setPaketParamForm(EMPTY_PAKET_PARAM_FORM);
    setEditingPaketParam(null);
    setPaketParameters([]);
  }, [hideModalAlert]);

  const handleFormChange = useCallback((event) => {
    hideModalAlert();
    const { name, value, type, checked } = event.target;

    if (name === 'is_new_parameter') {
      setFormData((prev) => ({
        ...prev,
        is_new_parameter: checked,
        id_parameter: checked ? '' : prev.id_parameter,
        nama_parameter: checked ? prev.nama_parameter || '' : '',
        kategori_parameter: checked ? prev.kategori_parameter || '' : '',
      }));
      return;
    }

    if (name === 'is_new_metode') {
      setFormData((prev) => ({
        ...prev,
        is_new_metode: checked,
        id_metode: checked ? '' : prev.id_metode,
        nama_metode: checked ? prev.nama_metode || '' : '',
      }));
      return;
    }

    if (name === 'tarif') {
      setFormData((prev) => ({
        ...prev,
        tarif: getCurrencyDigits(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, [hideModalAlert]);

  const handlePaketParamFormChange = useCallback((event) => {
    const { name, value } = event.target;

    setPaketParamForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      hideModalAlert();

      try {
        const body = normalizeTarifBody({ ...formData });

        if (modalType === 'add_param_metode' || modalType === 'edit_param_metode') {
          const duplicateWarning = buildDuplicateParameterMetodeWarning({
            body,
            selectedItem,
            parameterMetodeData,
            parametersOption,
            methodsOption,
          });

          if (duplicateWarning) {
            throw createDuplicateWarning(duplicateWarning);
          }
        }

        if ((modalType === 'add_tarif' || modalType === 'edit_tarif') && toCurrencyNumber(body.tarif) <= 0) {
          throw new Error('Tarif harus diisi lebih dari 0.');
        }

        await saveByModalType(modalType, body, selectedItem);

        showToast(`Berhasil ${selectedItem ? 'mengubah' : 'menambahkan'} data`);
        handleCloseModal();
        fetchData();
      } catch (error) {
        const message = error.message || 'Terjadi kesalahan';
        const type = isDuplicateError(error) ? 'warning' : 'error';

        const isParameterMetodeModal = modalType === 'add_param_metode' || modalType === 'edit_param_metode';
        const title = isDuplicateError(error) ? 'Data sudah ada' : undefined;

        if (isParameterMetodeModal) {
          showModalAlert(message, type, { title });
          return;
        }

        showToast(message, type, { title });
      }
    },
    [
      fetchData,
      formData,
      handleCloseModal,
      hideModalAlert,
      methodsOption,
      modalType,
      parameterMetodeData,
      parametersOption,
      selectedItem,
      showModalAlert,
      showToast,
    ]
  );

  const openDeleteConfirm = useCallback((type, item) => {
    const meta = DELETE_META[type] || {};

    const willDeactivate = item?.can_delete === false;

    setConfirmDelete({
      type,
      item,
      title: willDeactivate ? (meta.title || 'Data').replace('Hapus', 'Nonaktifkan') : (meta.title || 'Hapus Data'),
      description: meta.description ? meta.description(item) : '',
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;

    try {
      const result = await deleteByType(confirmDelete.type, confirmDelete.item);

      showToast(result?.message || 'Data berhasil diproses');

      if (confirmDelete.type === 'paket_param' && selectedItem?.id_pkt_bm) {
        fetchPaketParameters(selectedItem.id_pkt_bm);
      } else {
        fetchData();
      }

      setConfirmDelete(null);
    } catch (error) {
      showToast(error.message || 'Gagal menghapus data', 'error');
    }
  }, [confirmDelete, fetchData, fetchPaketParameters, selectedItem, showToast]);


  const handleToggleMasterStatus = useCallback(
    async (type, item) => {
      try {
        const isCurrentlyActive = normalizeBool(item?.is_active);
        const result = type === 'regulasi'
          ? await adminParameterApi.toggleRegulasiStatus(item)
          : await adminParameterApi.togglePaketStatus(item);

        showToast(
          result?.message || `Berhasil ${isCurrentlyActive ? 'menonaktifkan' : 'mengaktifkan'} ${type === 'regulasi' ? 'regulasi' : 'paket'}`
        );
        fetchData();
      } catch (error) {
        showToast(error.message || 'Gagal mengubah status data', 'error');
      }
    },
    [fetchData, showToast]
  );

  const handleKelolaPaket = useCallback(
    async (paket) => {
      setSelectedItem(paket);
      setModalType('manage_paket_param');
      setIsModalOpen(true);
      setPaketParamForm(EMPTY_PAKET_PARAM_FORM);
      setEditingPaketParam(null);

      await fetchPaketParameters(paket.id_pkt_bm);
    },
    [fetchPaketParameters]
  );

  const handleAddPaketParameter = useCallback(
    async (event) => {
      event.preventDefault();
      hideModalAlert();

      try {
        if (!paketParamForm.id_parameter) {
          throw new Error('Pilih parameter terlebih dahulu');
        }

        if (!paketParamForm.nilai_bm?.trim()) {
          throw new Error('Nilai baku mutu harus diisi');
        }

        await adminParameterApi.addPaketParameter(selectedItem.id_pkt_bm, {
          id_parameter: paketParamForm.id_parameter,
          nilai_bm: paketParamForm.nilai_bm,
          satuan_bm: paketParamForm.satuan_bm,
          ket_bm: paketParamForm.ket_bm,
        });

        showToast('Berhasil menambahkan parameter');
        setPaketParamForm(EMPTY_PAKET_PARAM_FORM);
        fetchPaketParameters(selectedItem.id_pkt_bm);
      } catch (error) {
        showToast(error.message || 'Gagal menambahkan parameter', 'error');
      }
    },
    [fetchPaketParameters, hideModalAlert, paketParamForm, selectedItem, showToast]
  );

  const handleStartEditPaketParameter = useCallback((item) => {
    setEditingPaketParam({
      ...item,
      nilai_bm: item.nilai_bm || '',
      satuan_bm: item.satuan_bm || '',
      ket_bm: item.ket_bm || '',
    });
  }, []);

  const handleUpdatePaketParameter = useCallback(
    async (event) => {
      event.preventDefault();
      hideModalAlert();

      try {
        if (!editingPaketParam?.nilai_bm?.trim()) {
          throw new Error('Nilai baku mutu harus diisi');
        }

        await adminParameterApi.updatePaketParameter(editingPaketParam, {
          nilai_bm: editingPaketParam.nilai_bm,
          satuan_bm: editingPaketParam.satuan_bm,
          ket_bm: editingPaketParam.ket_bm,
        });

        showToast('Berhasil mengubah nilai baku mutu');
        setEditingPaketParam(null);
        fetchPaketParameters(selectedItem.id_pkt_bm);
      } catch (error) {
        showToast(error.message || 'Gagal mengubah nilai baku mutu', 'error');
      }
    },
    [editingPaketParam, fetchPaketParameters, hideModalAlert, selectedItem, showToast]
  );

  const handleEditPaketParamChange = useCallback((event) => {
    const { name, value } = event.target;

    setEditingPaketParam((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);


  const currentFilterOptions = useMemo(() => {
    if (activeTab === 'parameter_metode') {
      return ['Semua', 'Terakreditasi', 'Non-akreditasi'];
    }

    return [];
  }, [activeTab]);

  const filteredParameterMetode = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return parameterMetodeData.filter((item) => {
      const text = [
        item.id_metode_parameter,
        item.parameter?.id_parameter,
        stripHtml(item.parameter?.nama_parameter),
        item.parameter?.kategori_parameter || item.parameter?.kategori?.nama_kategori,
        item.metode?.nama_metode,
        item.acuan_metode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchSearch = !query || text.includes(query);

      const isAccredited = normalizeBool(item.is_terakreditasi);
      const matchFilter =
        filterStatus === 'Semua' ||
        (filterStatus === 'Terakreditasi' && isAccredited) ||
        (filterStatus === 'Non-akreditasi' && !isAccredited);

      return matchSearch && matchFilter;
    });
  }, [parameterMetodeData, searchQuery, filterStatus]);

  const filteredRegulasi = useMemo(() => regulasiData, [regulasiData]);

  const filteredPaket = useMemo(() => paketData, [paketData]);

  const filteredTarifPengambilan = useMemo(() => tarifPengambilanData, [tarifPengambilanData]);

  const currentRowsCount = useMemo(() => {
    if (activeTab === 'parameter_metode') return filteredParameterMetode.length;
    if (activeTab === 'regulasi') return filteredRegulasi.length;
    if (activeTab === 'tarif_pengambilan') return filteredTarifPengambilan.length;
    return filteredPaket.length;
  }, [
    activeTab,
    filteredParameterMetode.length,
    filteredRegulasi.length,
    filteredPaket.length,
    filteredTarifPengambilan.length,
  ]);

  const rowsByTab = useMemo(
    () => ({
      parameterMetode: filteredParameterMetode,
      regulasi: filteredRegulasi,
      paket: filteredPaket,
      tarifPengambilan: filteredTarifPengambilan,
    }),
    [filteredParameterMetode, filteredRegulasi, filteredPaket, filteredTarifPengambilan]
  );

  const handleAddCurrentTab = useCallback(() => {
    if (activeTab === 'parameter_metode') handleOpenModal('add_param_metode');
    if (activeTab === 'regulasi') handleOpenModal('add_regulasi');
    if (activeTab === 'paket_baku_mutu') handleOpenModal('add_paket');
    if (activeTab === 'tarif_pengambilan') handleOpenModal('add_tarif');
  }, [activeTab, handleOpenModal]);

  const addButtonLabel = useMemo(() => {
    if (activeTab === 'parameter_metode') return 'Tambah Parameter';
    if (activeTab === 'regulasi') return 'Tambah Regulasi';
    if (activeTab === 'tarif_pengambilan') return 'Tambah Tarif';
    return 'Tambah Paket';
  }, [activeTab]);

  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'parameter_metode') {
      return 'Cari parameter, metode, acuan, atau satuan...';
    }

    if (activeTab === 'regulasi') {
      return 'Cari instansi atau referensi regulasi...';
    }

    if (activeTab === 'tarif_pengambilan') {
      return 'Cari jarak atau keterangan...';
    }

    return 'Cari nama paket, regulasi, atau jenis sampel...';
  }, [activeTab]);

  return {
    activeTab,
    isLoading,
    isModalLoading,
    searchQuery,
    searchPlaceholder,
    filterStatus,
    currentFilterOptions,
    currentRowsCount,
    addButtonLabel,
    rowsByTab,
    toast,
    hideToast,
    modalAlert,
    hideModalAlert,
    isModalOpen,
    modalType,
    selectedItem,
    formData,
    confirmDelete,
    paketParamForm,
    editingPaketParam,
    paketParameters,
    parametersOption,
    methodsOption,
    kategoriParameterOptions,
    regulasiData,
    jenisSampelOptions,
    handleChangeTab,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleAddCurrentTab,
    handleKelolaPaket,
    handleToggleMasterStatus,
    handlePaketParamFormChange,
    handleAddPaketParameter,
    handleEditPaketParamChange,
    handleStartEditPaketParameter,
    handleUpdatePaketParameter,
    openDeleteConfirm,
    handleConfirmDelete,
    setSearchQuery,
    setFilterStatus,
    setConfirmDelete,
    setEditingPaketParam,
  };
}
