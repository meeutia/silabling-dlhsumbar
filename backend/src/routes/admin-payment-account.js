const express = require('express');
const router = express.Router();
const PaymentAccountController = require('../controllers/admin-payment-account.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const Roles = require('../constants/roles');

router.use(verifyToken, authorizeRoles(Roles.ADMIN));

router.get('/', PaymentAccountController.getPaymentAccounts);
router.post('/', PaymentAccountController.createPaymentAccount);
router.put('/:idRekening', PaymentAccountController.updatePaymentAccount);
router.delete('/:idRekening', PaymentAccountController.deletePaymentAccount);

module.exports = router;
