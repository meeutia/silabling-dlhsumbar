import { DetailSampleScheduleSection } from '../../components/pelanggan/detail/DetailSampleScheduleSection';
import { DetailTimelineSection } from '../../components/pelanggan/detail/DetailTimelineSection';
import { DetailPermohonanHeader } from '../../components/pelanggan/detail/DetailPermohonanHeader';
import { DetailPaymentSection } from '../../components/pelanggan/detail/DetailPaymentSection';
import { getStatusBadge } from '../../components/pelanggan/detail/detailPermohonanStatusBadge.jsx';
import { useDetailPermohonanPage } from '../../components/pelanggan/detail/useDetailPermohonanPage';

export function PelangganDetailPermohonanPage({ request, onBack }) {
  const page = useDetailPermohonanPage(request);

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
            handlePaymentProofChange={page.handlePaymentProofChange}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Batalkan Permohonan?</h3>
              <p className="text-sm text-gray-600 mt-2">
                Jika dilanjutkan, seluruh permohonan ini akan dibatalkan oleh pelanggan.
                Catatan pembatalan tidak akan disimpan.
              </p>
            </div>

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
