import { requestData, requestJson } from './httpClient';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const adminPaymentAccountApi = {
  async getAll() {
    const rows = await requestData('/admin/payment-accounts', {}, { auth: true });
    return Array.isArray(rows) ? rows : [];
  },

  async save(payload, selectedItem = null) {
    const idRekening = selectedItem?.idRekening || selectedItem?.id_rekening;
    return requestJson(
      `/admin/payment-accounts${idRekening ? `/${idRekening}` : ''}`,
      {
        method: idRekening ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      { auth: true }
    );
  },

  async delete(item) {
    const idRekening = item?.idRekening || item?.id_rekening;
    return requestJson(`/admin/payment-accounts/${idRekening}`, { method: 'DELETE' }, { auth: true });
  },
};
