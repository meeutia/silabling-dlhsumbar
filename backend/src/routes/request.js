const express = require('express');
const router = express.Router();
const CustomerRequestController = require('../controllers/customer-request.controller');
const RequestWorkflowController = require('../controllers/request-workflow.controller');
const ScheduleChangeController = require('../controllers/schedule-change.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { uploadPaymentProofFile } = require('../middlewares/upload.middleware');
const Roles = require('../constants/roles');

const ADMIN_LIKE_ROLES = [Roles.ADMIN, Roles.PSP];
const {
  validateCreateRequest,
  validateVerifyRequest,
  validateAssignMethods,
  validateRejectRevision,
  validateCustomerPaymentAction,
  validateDeferredPaymentNote,
  validateSamplingSchedule,
  validateReceiveSamples,
  validateRequestIdParam,
  validateScheduleChangeRequest,
  validateScheduleChangeDecision,
  validateScheduleConfirmation,
} = require('../validators/request.validator');

router.use(verifyToken);


router.get('/schedule-changes', authorizeRoles(...ADMIN_LIKE_ROLES), ScheduleChangeController.listScheduleChangeRequests);
router.post('/schedule-changes', authorizeRoles(Roles.CUSTOMER), validateScheduleChangeRequest, ScheduleChangeController.createScheduleChangeRequest);
router.post('/schedule-changes/:idPengajuan/decision', authorizeRoles(...ADMIN_LIKE_ROLES), validateScheduleChangeDecision, ScheduleChangeController.decideScheduleChangeRequest);
router.post('/schedule-changes/:idPengajuan/cancel', authorizeRoles(Roles.CUSTOMER, ...ADMIN_LIKE_ROLES), ScheduleChangeController.cancelScheduleChangeRequest);

router.route('/')
  .post(authorizeRoles(Roles.CUSTOMER), validateCreateRequest, CustomerRequestController.createRequest)
  .get(authorizeRoles(Roles.CUSTOMER, ...ADMIN_LIKE_ROLES, Roles.KASI, Roles.PENYELIA), CustomerRequestController.listRequests);

router.get('/analysts/options', authorizeRoles(Roles.PENYELIA), RequestWorkflowController.getAnalystOptions);

router.get('/:id/activity-logs', authorizeRoles(Roles.CUSTOMER, ...ADMIN_LIKE_ROLES, Roles.KASI, Roles.PENYELIA), validateRequestIdParam, CustomerRequestController.getRequestActivityLogs);

router.get('/:id/invoice/pdf', authorizeRoles(Roles.CUSTOMER, ...ADMIN_LIKE_ROLES, Roles.KASI), validateRequestIdParam, CustomerRequestController.downloadInvoicePdf);
router.get('/:id/fppl/pdf', authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, RequestWorkflowController.downloadFpplDocument);
router.post('/:id/fppl/generate', authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, RequestWorkflowController.generateFpplDocument);

router.route('/:id')
  .get(authorizeRoles(Roles.CUSTOMER, ...ADMIN_LIKE_ROLES, Roles.KASI, Roles.PENYELIA), validateRequestIdParam, CustomerRequestController.detailRequest)
  .put(authorizeRoles(Roles.CUSTOMER), validateRequestIdParam, validateCreateRequest, CustomerRequestController.updateRequest);

router.post('/:id/schedule-confirmation', authorizeRoles(Roles.CUSTOMER), validateRequestIdParam, validateScheduleConfirmation, ScheduleChangeController.confirmScheduleApproval);

router.post('/:id/payment', authorizeRoles(Roles.CUSTOMER), validateRequestIdParam, validateCustomerPaymentAction, CustomerRequestController.processPaymentDecision);
router.post('/:id/payment/confirm', authorizeRoles(Roles.CUSTOMER), validateRequestIdParam, uploadPaymentProofFile, CustomerRequestController.confirmPaymentSubmitted);
router.post('/:id/payment/verify', authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, RequestWorkflowController.verifyManualPayment);
router.post('/:id/payment/deferred', authorizeRoles(...ADMIN_LIKE_ROLES, Roles.KASI), validateRequestIdParam, validateDeferredPaymentNote, RequestWorkflowController.markDeferredPayment);

router.route('/:id/sampling-schedule').post(authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, validateSamplingSchedule, RequestWorkflowController.createOrUpdateSamplingSchedule).put(authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, validateSamplingSchedule, RequestWorkflowController.createOrUpdateSamplingSchedule);

router.post('/:id/samples/receive', authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, validateReceiveSamples, RequestWorkflowController.receiveSamplesAndGenerateCodes);

router.put('/:id/verify', authorizeRoles(...ADMIN_LIKE_ROLES), validateRequestIdParam, validateVerifyRequest, RequestWorkflowController.verifyRequest);

router.route('/:id/methods').get(authorizeRoles(Roles.KASI), validateRequestIdParam, RequestWorkflowController.getKasiRequestDetail).put(authorizeRoles(Roles.KASI), validateRequestIdParam, validateAssignMethods, RequestWorkflowController.assignMethods);

router.put('/:id/reject', authorizeRoles(Roles.KASI), validateRequestIdParam, validateRejectRevision, RequestWorkflowController.rejectRequest);

router.post('/:id/assignments', authorizeRoles(Roles.PENYELIA), (req, res) => res.status(410).json({ success: false, message: 'Endpoint penugasan lama sudah tidak digunakan. Gunakan POST /assignments.' }));


module.exports = router;