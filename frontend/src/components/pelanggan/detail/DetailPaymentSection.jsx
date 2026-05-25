import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { FPPL_STATUSES } from '../../../utils/fpplStatus';

export function DetailPaymentSection({
  isAdminRejected,
  pembayaranRef,
  expandedSection,
  toggleSection,
  statusAktif,
  normalizedRequest,
  cleanDecisionNote,
  canShowInvoice,
  invoice,
  isPaymentDoneOrContinued,
  formatDate,
  formatCurrency,
  totalInvoice,
  subtotalUji,
  subtotalPengambilan,
  handleLihatInvoice,
  isInvoiceItemSubkontrak,
  getInvoiceItemQty,
  getInvoiceItemSubtotal,
  handleSetujuInvoice,
  handleTidakSetujuInvoice,
  paymentActionLoading,
  paymentProofError,
  paymentProofFile,
  handlePaymentProofChange,
  handleConfirmPayment,
  isWaitingPaymentVerification,
  isPaymentRejected,
  shouldCreateOrRefreshPayment,
  shouldShowGatewayPaymentPanel,
  handleChatAdmin,
}) {
  const paymentInstruction = invoice?.paymentInstruction || invoice?.payment_instruction || {};
  const manualPaymentBank =
    paymentInstruction.bankName ||
    paymentInstruction.bank_name ||
    import.meta.env.VITE_MANUAL_PAYMENT_BANK ||
    'Bank Nagari';
  const manualPaymentAccountNumber =
    paymentInstruction.accountNumber ||
    paymentInstruction.account_number ||
    import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NUMBER ||
    '0000000000';
  const manualPaymentAccountName =
    paymentInstruction.accountName ||
    paymentInstruction.account_name ||
    import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NAME ||
    'UPTD Laboratorium Lingkungan DLH Sumbar';
  const manualPaymentNote =
    paymentInstruction.note ||
    paymentInstruction.catatan ||
    import.meta.env.VITE_MANUAL_PAYMENT_NOTE ||
    'Pastikan nominal transfer sesuai total tagihan, lalu upload bukti pembayaran pada form di bawah.';

  if (isAdminRejected) return null;

  return (
<div
  ref={pembayaranRef}
  className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all"
>
  <button
    onClick={() => toggleSection('pembayaran')}
    className="w-full flex items-center justify-between p-6 text-left"
  >
    <div className="flex items-center gap-3">
      <CreditCard className="w-6 h-6 text-emerald-600" />
      <h2 className="text-xl font-semibold text-gray-900">
        Status Pembayaran & Tagihan
      </h2>
    </div>
    {expandedSection === 'pembayaran' ? (
      <ChevronUp className="w-5 h-5 text-gray-500" />
    ) : (
      <ChevronDown className="w-5 h-5 text-gray-500" />
    )}
  </button>

  {expandedSection === 'pembayaran' && (
    <div className="px-6 pb-6 space-y-6">
      {[FPPL_STATUSES.DIBATALKAN, FPPL_STATUSES.DIBATALKAN_PELANGGAN, FPPL_STATUSES.DITOLAK_ADMIN, FPPL_STATUSES.DITOLAK_KASI, FPPL_STATUSES.DITOLAK_PENYELIA].includes(statusAktif) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <p className="text-sm text-red-800 font-medium">
            Permohonan telah dibatalkan.
          </p>
          {normalizedRequest.catatanPenolakan && (
            <p className="text-sm text-red-700 mt-2">
              Catatan keputusan:{' '}
              {cleanDecisionNote || normalizedRequest.catatanPenolakan}
            </p>
          )}
          <p className="text-xs text-gray-600 mt-2">
            Jika ini tidak sesuai, silakan ajukan permohonan baru
            atau hubungi admin.
          </p>
        </div>
      )}

      {canShowInvoice && (
        <div className="border border-gray-200 bg-white rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Invoice
              </h4>
              <p className="text-xs text-gray-600">
                Invoice tetap dapat dilihat setelah pembayaran selesai.
              </p>
            </div>

            {isPaymentDoneOrContinued && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                Pembayaran Valid
              </span>
            )}

            {isWaitingPaymentVerification && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                Menunggu Verifikasi Admin
              </span>
            )}

            {statusAktif === FPPL_STATUSES.MENUNGGU_PEMBAYARAN && !invoice.payment && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Upload Bukti Diperlukan
              </span>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Nomor Invoice</span>
              <span className="text-sm font-semibold text-gray-900">
                {invoice.nomorInvoice}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tanggal Terbit</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatDate(invoice.tanggalTerbit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Tagihan</span>
              <span className="text-sm font-semibold text-emerald-700">
                {formatCurrency(totalInvoice)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLihatInvoice}
            className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Lihat Invoice
          </button>
        </div>
      )}

      {[
        FPPL_STATUSES.MENUNGGU_VERIFIKASI,
        FPPL_STATUSES.MENUNGGU_PENENTUAN_PARAMETER,
        FPPL_STATUSES.REVISION,
      ].includes(statusAktif) &&
        !canShowInvoice && (
          <div className="bg-gray-50 rounded-lg p-6 border border-dashed border-gray-300">
            <p className="text-sm font-semibold text-gray-900">
              Tagihan Belum Tersedia
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Metode uji dan tarif parameter belum ditetapkan oleh Kasi Pengujian.
              Invoice akan muncul setelah penentuan metode selesai.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Silakan cek kembali setelah permohonan disetujui oleh Kasi Pengujian.
            </p>
          </div>
        )}

    {statusAktif === FPPL_STATUSES.MENUNGGU_PEMBAYARAN && !invoice && (
      <div className="bg-gray-50 rounded-lg p-6 border border-dashed border-gray-300">
        <p className="text-sm font-semibold text-gray-900">
          Rincian Biaya Belum Tersedia
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Metode dan harga parameter masih dalam proses penetapan oleh petugas.
          Invoice akan muncul setelah selesai.
        </p>
        <p className="text-xs text-gray-500 mt-3">
          Silakan cek kembali secara berkala.
        </p>
      </div>
    )}

      {statusAktif === FPPL_STATUSES.MENUNGGU_PEMBAYARAN && invoice && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Rincian Biaya Pengujian
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Pastikan parameter, metode, dan tarif sudah sesuai
                  sebelum menyetujui tagihan dan mengupload bukti pembayaran.
                </p>
              </div>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  invoice.payment
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {shouldCreateOrRefreshPayment
                  ? invoice.payment
                    ? 'Perlu Buat Ulang Pembayaran'
                    : 'Upload Bukti Diperlukan'
                  : 'Menunggu Bukti Pembayaran'}
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
              <table className="w-full min-w-[980px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Parameter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Metode Uji
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Catatan
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Jumlah Sampel
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Biaya
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Jumlah Biaya
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.rincian?.parameters?.map((item, idx) => {
                    const isSubkontrak = isInvoiceItemSubkontrak(item);
                    const qty = getInvoiceItemQty(item);
                    const subtotal = getInvoiceItemSubtotal(item);
                    const catatanSubkontrak =
                      item.catatanSubkontrak ||
                      item.catatan_subkontrak ||
                      item.catatanKemampuan ||
                      item.catatan_kemampuan ||
                      '';

                    return (
                      <tr
                        key={`${item.idFpplParameterMetode || item.nama}-${idx}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{item.nama}</span>

                            {isSubkontrak && (
                              <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                                Subkontrak
                              </span>
                            )}
                          </div>

                          {item.statusKemampuanLab && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status Lab: {item.statusKemampuanLab === 'TIDAK_MAMPU'
                                ? 'Tidak Mampu / Subkontrak'
                                : 'Mampu'}
                            </p>
                          )}

                          {item.catatanKemampuan && (
                            <p className="text-xs text-gray-500 mt-1">
                              Catatan: {item.catatanKemampuan}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.metode}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {isSubkontrak ? (
                            <span className="text-orange-700">
                              {catatanSubkontrak || 'Parameter diproses sebagai subkontrak.'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-900 text-center font-semibold">
                          {qty}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(item.harga)}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Metode Sampling
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {invoice.rincian?.metodeSampling || '-'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {formatCurrency(invoice.rincian?.biayaSampling || 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-gray-300 flex justify-between items-center">
              <span className="font-semibold text-gray-900">
                Total Tagihan
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {formatCurrency(totalInvoice)}                          
              </span>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <p><span className="font-medium">Subtotal Uji:</span> Rp {subtotalUji.toLocaleString('id-ID')}</p>
              <p><span className="font-medium">Subtotal Pengambilan:</span> Rp {subtotalPengambilan.toLocaleString('id-ID')}</p>
              <p className="font-semibold text-lg">Total: Rp {totalInvoice.toLocaleString('id-ID')}</p>
            </div>


            {!invoice.payment?.isDeferredByAdmin && (
              <p className="text-xs text-red-600 mt-2">
                Setelah menyetujui tagihan, upload bukti pembayaran agar dapat diverifikasi admin.
              </p>
            )}
          </div>

          {shouldCreateOrRefreshPayment && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  Pembayaran manual
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Setujui rincian biaya terlebih dahulu. Setelah itu upload bukti pembayaran agar admin dapat memverifikasi pembayaran.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-4">
                <div className="rounded-lg border border-emerald-100 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Konfirmasi Rincian Biaya
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Pembayaran dilakukan melalui transfer manual. Setujui tagihan terlebih dahulu, lalu upload bukti pembayaran pada langkah berikutnya.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSetujuInvoice}
                    disabled={paymentActionLoading || Number(totalInvoice || 0) <= 0}
                    className="flex-1 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentActionLoading ? 'Menyimpan Persetujuan...' : 'Setujui Rincian Biaya'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTidakSetujuInvoice}
                    disabled={paymentActionLoading}
                    className="flex-1 px-5 py-3 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batalkan Permohonan
                  </button>
                </div>

                <button
                  onClick={handleChatAdmin}
                  type="button"
                  className="w-full px-5 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Kendala? Chat Admin via WhatsApp
                </button>
              </div>
            </div>
          )}

          {shouldShowGatewayPaymentPanel && (
            <div className="space-y-4">
              {isPaymentRejected ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <p className="text-sm font-semibold text-red-900">
                    Bukti pembayaran ditolak admin.
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    Upload ulang bukti pembayaran yang benar agar admin dapat melakukan verifikasi kembali.
                  </p>
                  {(invoice?.payment?.catatanVerifikasi || invoice?.payment?.catatan_verifikasi) && (
                    <p className="text-xs text-red-700 mt-3">
                      Catatan admin: {invoice.payment.catatanVerifikasi || invoice.payment.catatan_verifikasi}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                  <p className="text-sm font-semibold text-emerald-900">
                    Tagihan sudah disetujui
                  </p>
                  <p className="text-sm text-emerald-800 mt-1">
                    Upload bukti pembayaran agar admin dapat melakukan verifikasi manual.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
                <p className="text-sm font-semibold text-emerald-900">
                  Nomor Rekening Pembayaran
                </p>
                <p className="text-sm text-emerald-800 mt-1">
                  Transfer pembayaran ke rekening berikut, lalu upload bukti pembayaran agar dapat diverifikasi admin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nomor Rekening
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 break-all">
                    {manualPaymentAccountNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Bank: {manualPaymentBank}
                  </p>
                  <p className="text-xs text-gray-500">
                    A.n.: {manualPaymentAccountName}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Tagihan
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {formatCurrency(invoice.totalTagihan || totalInvoice)}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Invoice: {invoice.nomorInvoice || '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {isPaymentRejected ? 'Ditolak' : (invoice.payment?.statusVerifikasi || invoice.payment?.status_verifikasi || 'Menunggu Bukti')}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">
                  Catatan Transfer
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {manualPaymentNote}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h4 className="font-medium text-gray-900 mb-2">
                  Upload Bukti Pembayaran
                </h4>

                <p className="text-xs text-gray-600 mb-3">
                  Upload foto atau PDF bukti transfer. Format yang diterima: JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handlePaymentProofChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />

                {paymentProofFile && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <p className="text-sm font-medium text-emerald-800">
                      File dipilih: {paymentProofFile.name}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Ukuran: {(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {isPaymentRejected && (
                  <p className="text-xs text-red-600 mt-3">
                    Bukti lama tidak perlu dihapus manual. File baru akan menggantikan bukti pembayaran sebelumnya.
                  </p>
                )}

                {paymentProofError && (
                  <p className="text-sm text-red-600 mt-2">
                    {paymentProofError}
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={paymentActionLoading || !paymentProofFile}
                className="w-full px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {paymentActionLoading
                  ? isPaymentRejected
                    ? 'Mengupload Ulang Bukti...'
                    : 'Mengirim Bukti Pembayaran...'
                  : isPaymentRejected
                  ? 'Upload Ulang Bukti Pembayaran'
                  : 'Kirim Bukti Pembayaran'}
              </button>

              <button
                onClick={handleChatAdmin}
                type="button"
                className="w-full px-5 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Kendala? Chat Admin via WhatsApp
              </button>
            </div>
          )}

          {isWaitingPaymentVerification && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
              <p className="text-sm font-semibold text-yellow-900">
                Bukti pembayaran sedang diverifikasi admin.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                Permohonan akan dilanjutkan setelah admin menyetujui bukti pembayaran.
              </p>
            </div>
          )}
        </div>
      )}

      {statusAktif === FPPL_STATUSES.MENUNGGU_SAMPEL &&
        invoice?.payment?.isDeferredByAdmin && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-purple-900">
              Bayar Nanti dicatat oleh admin.
            </p>
            <p className="text-sm text-purple-800 mt-2">
              Permohonan tetap dilanjutkan ke tahap pengambilan
              sampel tanpa perlu upload bukti pembayaran dari sisi pelanggan.
            </p>
            {invoice?.payment?.adminNote && (
              <p className="text-sm text-purple-800 mt-2">
                Catatan admin: {invoice.payment.adminNote}
              </p>
            )}
          </div>
        )}

      {isPaymentDoneOrContinued &&
        !invoice?.payment?.isDeferredByAdmin && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Status Pembayaran
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Pembayaran Valid
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <p className="text-sm text-gray-700">
                Pembayaran telah dikonfirmasi dan permohonan
                dilanjutkan ke tahap berikutnya.
              </p>
            </div>
          </div>
        )}
    </div>
  )}
</div>
  );
}
