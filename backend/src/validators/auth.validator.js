const { errorResponse } = require('../utils/response');

const validateRegister = (req, res, next) => {
    const { nik, username, email, password } = req.body;

    const normalizedNik = String(nik || '').trim();
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedNik || !normalizedUsername || !normalizedEmail || !password) {
        return errorResponse(res, 'NIK, username, email, dan password wajib diisi.', 400);
    }

    if (!/^\d{16}$/.test(normalizedNik)) {
        return errorResponse(res, 'NIK harus 16 digit angka.', 400);
    }

    if (/\s/.test(normalizedUsername)) {
        return errorResponse(res, 'Username tidak boleh mengandung spasi.', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return errorResponse(res, 'Format email tidak valid.', 400);
    }

    if (String(password).length < 6) {
        return errorResponse(res, 'Password minimal 6 karakter.', 400);
    }

    req.body.nik = normalizedNik;
    req.body.username = normalizedUsername;
    req.body.email = normalizedEmail;

    next();
};

const validateLogin = (req, res, next) => {
    const { identifier, email, username, password } = req.body;
    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier || !password) {
        return errorResponse(res, 'Email/username dan password wajib diisi.', 400);
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin
};