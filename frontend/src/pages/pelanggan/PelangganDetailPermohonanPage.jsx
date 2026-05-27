import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { DetailSampleScheduleSection } from '../../components/pelanggan/detail/DetailSampleScheduleSection';
import { DetailTimelineSection } from '../../components/pelanggan/detail/DetailTimelineSection';
import { DetailPermohonanHeader } from '../../components/pelanggan/detail/DetailPermohonanHeader';
import { DetailPaymentSection } from '../../components/pelanggan/detail/DetailPaymentSection';
import { getStatusBadge } from '../../components/pelanggan/detail/detailPermohonanStatusBadge.jsx';
import { useDetailPermohonanPage } from '../../components/pelanggan/detail/useDetailPermohonanPage';

export function PelangganDetailPermohonanPage({ request, onBack }) {
  const page = useDetailPermohonanPage(request);
  const customerCancelModalRef = useRef(null);

  useEffect(() => {
    if (!page.customerCancelModalOpen || !page.customerCancelAlert) return;

    window.setTimeout(() => {
      customerCancelModalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, [page.customerCancelAlert, page.customerCancelModalOpen]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DetailPermohonanHeader
          onBack={onBack}
          officerWhatsAppLink={page.officerWhatsAppLink}
          activeSchedule={page.activeSchedule}
          normalizedRequest={page.normalizedRequest}
          customerProfile={page.customerProfile}
          requestData={page.requestData}
          statusAktif={page.statusAktif}
          shouldShowDecisionNote={page.shouldShowDecisionNote}
          cleanDecisionNote={page.cleanDecisionNote}
          progressSteps={page.progressSteps}
          formatDate={page.formatDate}
          formatDateTime={page.formatDateTime}
          getStatusBadge={getStatusBadge}
        />

        <div className="space-y-4">
          <DetailPaymentSection
            isAdminRejected={page.isAdminRejected}
            pembayaranRef={page.pembayaranRef}
            expandedSection={page.expandedSection}
            toggleSection={page.toggleSection}
            statusAktif={page.statusAktif}
            normalizedRequest={page.normalizedRequest}
            cleanDecisionNote={page.cleanDecisionNote}
            canShowInvoice={page.canShowInvoice}
            invoice={page.invoice}
            isPaymentDoneOrContinued={page.isPaymentDoneOrContinued}
            formatDate={page.formatDate}
            formatDateTime={page.formatDateTime}
            formatCurrency={page.formatCurrency}
            totalInvoice={page.totalInvoice}
            subtotalUji={page.subtotalUji}
            subtotalPengambilan={page.subtotalPengambilan}
            handleLihatInvoice={page.handleLihatInvoice}
            isInvoiceItemSubkontrak={page.isInvoiceItemSubkontrak}
            getInvoiceItemQty={page.getInvoiceItemQty}
            getInvoiceItemSubtotal={page.getInvoiceItemSubtotal}
            selectedPaymentMethod={page.selectedPaymentMethod}
            setSelectedPaymentMethod={page.setSelectedPaymentMethod}
            handleSetujuInvoice={page.handleSetujuInvoice}
            handleTidakSetujuInvoice={page.handleTidakSetujuInvoice}
            paymentActionLoading={page.paymentActionLoading}
            detailRefreshing={page.detailRefreshing}
            paymentGateway={page.paymentGateway}
            paymentProofError={page.paymentProofError}
            paymentProofFile={page.paymentProofFile}
            paymentProofInputRef={page.paymentProofInputRef}
            handlePaymentProofChange={page.handlePaymentProofChange}
            handleClearPaymentProof={page.handleClearPaymentProof}
            handleConfirmPayment={page.handleConfirmPayment}
            isWaitingPaymentVerification={page.isWaitingPaymentVerification}
            isGatewayExpired={page.isGatewayExpired}
            isPaymentRejected={page.isPaymentRejected}
            shouldCreateOrRefreshPayment={page.shouldCreateOrRefreshPayment}
            shouldShowGatewayPaymentPanel={page.shouldShowGatewayPaymentPanel}
            handleChatAdmin={page.handleChatAdmin}
          />

          <DetailTimelineSection
            timelineRef={page.timelineRef}
            expandedSection={page.expandedSection}
            toggleSection={page.toggleSection}
            timelineItems={page.timelineItems}
          />

          {!page.isAdminRejected && (
            <DetailSampleScheduleSection
              sampelRef={page.sampelRef}
              expandedSection={page.expandedSection}
              toggleSection={page.toggleSection}
              statusAktif={page.statusAktif}
              requestData={page.requestData}
              normalizedRequest={page.normalizedRequest}
              invoice={page.invoice}
              billing={page.billing}
              activeSchedule={page.activeSchedule}
              officerWhatsAppLink={page.officerWhatsAppLink}
              requestSamples={page.requestSamples}
              formatDateTime={page.formatDateTime}
              formatCurrency={page.formatCurrency}
              getSampleParameterMethods={page.getSampleParameterMethods}
              getSampleTypeName={page.getSampleTypeName}
              getRegBmLabel={page.getRegBmLabel}
              getParameterName={page.getParameterName}
              getMethodName={page.getMethodName}
              getParameterPrice={page.getParameterPrice}
              isParameterSubkontrak={page.isParameterSubkontrak}
              getKasiPengujianNote={page.getKasiPengujianNote}
              lhuPickupInfo={page.lhuPickupInfo}
              minScheduleDate={page.minScheduleDate}
              activeScheduleChangeType={page.activeScheduleChangeType}
              handleOpenScheduleChangeForm={page.handleOpenScheduleChangeForm}
              handleCancelScheduleChangeForm={page.handleCancelScheduleChangeForm}
              handleConfirmSchedule={page.handleConfirmSchedule}
              scheduleChangeAlert={page.scheduleChangeAlert}
              scheduleChangeForm={page.scheduleChangeForm}
              setScheduleChangeForm={page.setScheduleChangeForm}
              handleScheduleChangeDateChange={page.handleScheduleChangeDateChange}
              handleScheduleChangeTimeChange={page.handleScheduleChangeTimeChange}
              operationalTimeOptions={page.operationalTimeOptions}
              scheduleChangeLoading={page.scheduleChangeLoading}
              scheduleConfirmLoading={page.scheduleConfirmLoading}
              handleScheduleChangeSubmit={page.handleScheduleChangeSubmit}
            />
          )}

        </div>
      </div>

      {page.customerCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={customerCancelModalRef} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Batalkan Permohonan?</h3>
              <p className="text-sm text-gray-600 mt-2">
                Jika dilanjutkan, seluruh permohonan ini akan dibatalkan oleh pelanggan.
                Catatan pembatalan tidak akan disimpan.
              </p>
            </div>

            {page.customerCancelAlert && (
              <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Data perlu dicek</p>
                    <p className="mt-1 leading-relaxed">{page.customerCancelAlert}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={page.handleCloseCustomerCancelModal}
                disabled={page.paymentActionLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={page.handleConfirmCustomerCancel}
                disabled={page.paymentActionLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {page.paymentActionLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
