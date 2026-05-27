const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op, fn, col, where } = require('sequelize');

const { User, Role, Pelanggan, Pegawai, UserRefreshSession } = require('../models/Associations');
const Roles = require('../constants/roles');
const { sendMail } = require('../utils/mailer');
const { assertPasswordPolicy } = require('../utils/password-policy.util');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7);
const RESET_PASSWORD_EXPIRES_MINUTES = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15);

const generateToken = (user) => {
  return jwt.sign(
    { nik: user.nik, id_role: user.id_role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString('hex');
};

const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const getRefreshExpiryDate = () => {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
};

const getResetPasswordExpiryDate = () => {
  return new Date(Date.now() + RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000);
};

const cleanupExpiredRefreshSessions = async (nik) => {
  if (!nik) return;

  await UserRefreshSession.destroy({
    where: {
      nik,
      [Op.or]: [
        { refresh_token_expires_at: { [Op.lte]: new Date() } },
        { revoked_at: { [Op.not]: null } },
      ],
    },
  });
};

const createRefreshSession = async (nik) => {
  await cleanupExpiredRefreshSessions(nik);

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshExpiresAt = getRefreshExpiryDate();

  await UserRefreshSession.create({
    nik,
    refresh_token_hash: refreshTokenHash,
    refresh_token_expires_at: refreshExpiresAt,
    created_at: new Date(),
    last_used_at: new Date(),
    revoked_at: null,
  });

  await User.update(
    {
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: refreshExpiresAt,
    },
    { where: { nik } }
  );

  return refreshToken;
};

const revokeAllRefreshSessions = async (nik) => {
  if (!nik) return;

  await UserRefreshSession.update(
    { revoked_at: new Date() },
    {
      where: {
        nik,
        revoked_at: null,
      },
    }
  );

  await User.update(
    {
      refresh_token_hash: null,
      refresh_token_expires_at: null,
    },
    { where: { nik } }
  );
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getPlain = (instance) => {
  return instance && typeof instance.get === 'function'
    ? instance.get({ plain: true })
    : instance;
};

const getRoleFromUser = (user) => {
  return user?.role || user?.Role || null;
};

const getPelanggansFromUser = (user) => {
  if (Array.isArray(user?.pelanggans)) return user.pelanggans;
  if (Array.isArray(user?.Pelanggans)) return user.Pelanggans;
  if (Array.isArray(user?.pelanggan)) return user.pelanggan;
  if (Array.isArray(user?.Pelanggan)) return user.Pelanggan;
  return [];
};

const buildUserPayload = (userInstance) => {
  const user = getPlain(userInstance) || {};
  const role = getRoleFromUser(user);
  const pelanggans = getPelanggansFromUser(user);
  const pel = pelanggans.length > 0 ? pelanggans[0] : null;

  return {
    nik: user.nik,
    username: user.username,
    email: user.email,
    id_role: user.id_role,
    nama_role: role ? role.nama_role : null,

    id_pelanggan: pel ? pel.id_pelanggan : null,
    no_telp: pel ? pel.no_telp : null,
    alamat: pel ? pel.alamat : null,
    nama_instansi: pel ? pel.nama_instansi : null,
    pic: pel ? pel.pic : null,
    email_kontak: pel ? pel.email_kontak : null,
  };
};


const buildNoAccountLoginMessage = (record) => {
  if (!record) {
    return 'Data ditemukan, tetapi belum memiliki akun login.';
  }

  if (record.type === 'pegawai') {
    const name = record.name ? ` untuk ${record.name}` : '';
    return `Data pegawai${name} ditemukan, tetapi belum memiliki akun login. Minta Kepala Sub Bagian Tata Usaha membuat akun terlebih dahulu.`;
  }

  if (record.type === 'pelanggan') {
    const name = record.name ? ` untuk ${record.name}` : '';
    return `Data pelanggan${name} ditemukan, tetapi belum memiliki akun portal. Silakan daftar akun pelanggan atau hubungi admin.`;
  }

  return 'Data ditemukan, tetapi belum memiliki akun login.';
};

const buildNotRegisteredLoginMessage = (identifier) => {
  const label = String(identifier || '').trim();

  if (!label) {
    return 'Akun Anda sepertinya belum terdaftar.';
  }

  return `Akun dengan identitas "${label}" sepertinya belum terdaftar.`;
};

const hasUserAccount = async (nik) => {
  const normalizedNik = String(nik || '').trim();

  if (!normalizedNik) {
    return false;
  }

  const user = await User.findByPk(normalizedNik, {
    attributes: ['nik'],
  });

  return Boolean(user);
};

const findKnownIdentityWithoutAccount = async (identifier) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizedIdentifier.toLowerCase();
  const digitsOnly = normalizedIdentifier.replace(/\D/g, '');

  if (!normalizedIdentifier) {
    return null;
  }

  const pegawaiConditions = [];

  if (digitsOnly) {
    pegawaiConditions.push({ nik: digitsOnly });
    pegawaiConditions.push({ nip: digitsOnly });
    pegawaiConditions.push({ no_wa: digitsOnly });
  }

  if (normalizedIdentifier && normalizedIdentifier !== digitsOnly) {
    pegawaiConditions.push({ no_wa: normalizedIdentifier });
  }

  if (pegawaiConditions.length > 0) {
    const pegawai = await Pegawai.findOne({
      where: { [Op.or]: pegawaiConditions },
      attributes: ['nik', 'nip', 'nama_pegawai', 'jabatan', 'no_wa'],
    });

    const plainPegawai = getPlain(pegawai);

    if (plainPegawai && !(await hasUserAccount(plainPegawai.nik))) {
      return {
        type: 'pegawai',
        name: plainPegawai.nama_pegawai,
      };
    }
  }

  const pelangganConditions = [];

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    pelangganConditions.push({ email_kontak: normalizedEmail });
  }

  if (digitsOnly) {
    pelangganConditions.push({ nik: digitsOnly });
    pelangganConditions.push({ no_telp: digitsOnly });
  }

  if (pelangganConditions.length > 0) {
    const pelanggan = await Pelanggan.findOne({
      where: { [Op.or]: pelangganConditions },
      attributes: ['nik', 'nama_instansi', 'pic', 'email_kontak', 'no_telp'],
    });

    const plainPelanggan = getPlain(pelanggan);

    if (plainPelanggan && !(await hasUserAccount(plainPelanggan.nik))) {
      return {
        type: 'pelanggan',
        name: plainPelanggan.nama_instansi || plainPelanggan.pic,
      };
    }
  }

  return null;
};

const findUserWithProfile = async (where) => {
  return User.findOne({
    where,
    include: [
      {
        model: Role,
        attributes: ['nama_role'],
      },
      {
        model: Pelanggan,
        attributes: [
          'id_pelanggan',
          'no_telp',
          'alamat',
          'nama_instansi',
          'pic',
          'email_kontak',
        ],
      },
    ],
  });
};

const register = async (data) => {
  const { nik, username, email, password } = data;

  const normalizedNik = String(nik || '').trim();
  const normalizedUsername = String(username || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedNik || !/^\d{16}$/.test(normalizedNik)) {
    throw new Error('NIK harus 16 digit angka.');
  }

  if (!normalizedUsername) {
    throw new Error('Username wajib diisi.');
  }

  if (/\s/.test(normalizedUsername)) {
    throw new Error('Username tidak boleh mengandung spasi.');
  }

  if (!normalizedEmail) {
    throw new Error('Email wajib diisi.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Format email tidak valid.');
  }

  const normalizedPassword = assertPasswordPolicy(password);

  const existingNik = await User.findByPk(normalizedNik);
  if (existingNik) {
    throw new Error('NIK sudah terdaftar.');
  }

  const existingEmail = await User.findOne({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new Error('Email sudah terdaftar.');
  }

  const existingUsername = await User.findOne({
    where: { username: normalizedUsername },
  });
  if (existingUsername) {
    throw new Error('Username sudah terdaftar.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

  const newUser = await User.create({
    nik: normalizedNik,
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    id_role: Roles.CUSTOMER,
    is_active: 1,
  });

  const refreshToken = await createRefreshSession(newUser.nik);

  const userWithProfile = await findUserWithProfile({ nik: normalizedNik });
  const token = generateToken(userWithProfile);

  return {
    user: buildUserPayload(userWithProfile),
    token,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshToken,
  };
};

const login = async (identifier, password) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizedIdentifier.toLowerCase();
  const normalizedUsername = normalizedIdentifier.toLowerCase();

  if (!normalizedIdentifier || !password) {
    throw new Error('Email/username dan password wajib diisi.');
  }

  const user = await User.findOne({
    where: {
      [Op.or]: [
        where(fn('LOWER', col('email')), normalizedEmail),
        where(fn('LOWER', col('username')), normalizedUsername),
        { nik: normalizedIdentifier },
      ],
    },
    include: [
      {
        model: Role,
        attributes: ['nama_role'],
      },
      {
        model: Pelanggan,
        attributes: [
          'id_pelanggan',
          'no_telp',
          'alamat',
          'nama_instansi',
          'pic',
          'email_kontak',
        ],
      },
    ],
  });

  if (!user) {
    const knownIdentityWithoutAccount = await findKnownIdentityWithoutAccount(normalizedIdentifier);

    if (knownIdentityWithoutAccount) {
      throw new Error(buildNoAccountLoginMessage(knownIdentityWithoutAccount));
    }

    throw new Error(buildNotRegisteredLoginMessage(normalizedIdentifier));
  }

  if (!user.is_active) {
    throw new Error('Akun Anda telah dinonaktifkan.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email atau password salah.');
  }

  const refreshToken = await createRefreshSession(user.nik);

  const token = generateToken(user);

  return {
    user: buildUserPayload(user),
    token,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshToken,
  };
};

const forgotPassword = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email wajib diisi.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Format email tidak valid.');
  }

  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  // Sengaja generic supaya tidak membocorkan email mana yang terdaftar.
  if (!user) {
    return { sent: true };
  }

  // Tetap generic juga supaya status akun tidak mudah ditebak dari luar.
  if (!user.is_active) {
    return { sent: true };
  }

  const resetToken = generateResetToken();
  const resetTokenHash = hashResetToken(resetToken);
  const expiresAt = getResetPasswordExpiryDate();

  await user.update({
    reset_password_token_hash: resetTokenHash,
    reset_password_expires_at: expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeUsername = escapeHtml(user.username || user.email || 'Pengguna');

  try {
    await sendMail({
      to: user.email,
      subject: 'Reset Kata Sandi Akun SILABLING',
      text:
        `Halo ${user.username || 'Pengguna'},\n\n` +
        `Kami menerima permintaan reset kata sandi untuk akun SILABLING Anda.\n\n` +
        `Klik link berikut untuk membuat kata sandi baru:\n${resetUrl}\n\n` +
        `Link ini berlaku selama ${RESET_PASSWORD_EXPIRES_MINUTES} menit.\n\n` +
        `Jika Anda tidak meminta reset kata sandi, abaikan email ini.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">Reset Kata Sandi SILABLING</h2>
          <p>Halo <strong>${safeUsername}</strong>,</p>
          <p>Kami menerima permintaan reset kata sandi untuk akun SILABLING Anda.</p>
          <p>Klik tombol berikut untuk membuat kata sandi baru:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold;">
              Reset Kata Sandi
            </a>
          </p>
          <p>Link ini berlaku selama <strong>${RESET_PASSWORD_EXPIRES_MINUTES} menit</strong>.</p>
          <p>Jika tombol tidak bisa diklik, salin link berikut ke browser:</p>
          <p style="word-break:break-all;color:#374151;background:#f3f4f6;padding:12px;border-radius:8px;">${resetUrl}</p>
          <p>Jika Anda tidak meminta reset kata sandi, abaikan email ini.</p>
        </div>
      `,
    });

    console.log(`[auth-service] Reset password email sent to ${user.email}`);
    return { sent: true };
  } catch (emailError) {
    console.error(`[auth-service] Failed to send reset password email to ${user.email}:`, emailError.message);
    
    // Jangan revoke token, tapi throw error agar user tahu
    throw new Error(`Gagal mengirim email reset kata sandi. Silakan coba lagi. (${emailError.message})`);
  }
};

const resetPassword = async ({ token, password, confirmPassword }) => {
  const resetToken = String(token || '').trim();
  const newPassword = String(password || '');
  const confirmation = String(confirmPassword || '');

  if (!resetToken) {
    throw new Error('Token reset tidak valid.');
  }

  const normalizedNewPassword = assertPasswordPolicy(newPassword, 'Password baru minimal 8 karakter dan harus mengandung huruf serta angka.');

  if (!confirmation) {
    throw new Error('Konfirmasi password wajib diisi.');
  }

  if (newPassword !== confirmation) {
    throw new Error('Konfirmasi password tidak sesuai.');
  }

  const resetTokenHash = hashResetToken(resetToken);

  const user = await User.findOne({
    where: {
      reset_password_token_hash: resetTokenHash,
      reset_password_expires_at: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Link reset password tidak valid atau sudah kedaluwarsa.');
  }

  if (!user.is_active) {
    throw new Error('Akun Anda telah dinonaktifkan.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(normalizedNewPassword, salt);

  await user.update({
    password: hashedPassword,
    reset_password_token_hash: null,
    reset_password_expires_at: null,
    refresh_token_hash: null,
    refresh_token_expires_at: null,
  });

  await revokeAllRefreshSessions(user.nik);

  return { success: true };
};

const refresh = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new Error('Refresh token tidak ditemukan.');
  }

  const refreshTokenHash = hashRefreshToken(incomingRefreshToken);
  const refreshSession = await UserRefreshSession.findOne({
    where: {
      refresh_token_hash: refreshTokenHash,
      revoked_at: null,
    },
  });

  let user = null;

  if (refreshSession) {
    if (!refreshSession.refresh_token_expires_at || new Date(refreshSession.refresh_token_expires_at) <= new Date()) {
      await refreshSession.update({ revoked_at: new Date() });
      throw new Error('Refresh token sudah kadaluarsa.');
    }

    user = await findUserWithProfile({ nik: refreshSession.nik });
  } else {
    user = await findUserWithProfile({ refresh_token_hash: refreshTokenHash });

    if (!user) {
      throw new Error('Refresh token tidak valid.');
    }

    if (!user.refresh_token_expires_at || new Date(user.refresh_token_expires_at) <= new Date()) {
      await user.update({
        refresh_token_hash: null,
        refresh_token_expires_at: null,
      });

      throw new Error('Refresh token sudah kadaluarsa.');
    }
  }

  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  if (!user.is_active) {
    if (refreshSession) {
      await refreshSession.update({ revoked_at: new Date() });
    }

    await User.update(
      {
        refresh_token_hash: null,
        refresh_token_expires_at: null,
      },
      { where: { nik: user.nik } }
    );

    throw new Error('Akun Anda telah dinonaktifkan.');
  }

  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
  const refreshExpiresAt = getRefreshExpiryDate();

  if (refreshSession) {
    await refreshSession.update({
      refresh_token_hash: newRefreshTokenHash,
      refresh_token_expires_at: refreshExpiresAt,
      last_used_at: new Date(),
    });
  } else {
    await UserRefreshSession.create({
      nik: user.nik,
      refresh_token_hash: newRefreshTokenHash,
      refresh_token_expires_at: refreshExpiresAt,
      created_at: new Date(),
      last_used_at: new Date(),
      revoked_at: null,
    });
  }

  await User.update(
    {
      refresh_token_hash: newRefreshTokenHash,
      refresh_token_expires_at: refreshExpiresAt,
    },
    { where: { nik: user.nik } }
  );

  const token = generateToken(user);

  return {
    user: buildUserPayload(user),
    token,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshToken: newRefreshToken,
  };
};

const logout = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    return;
  }

  const refreshTokenHash = hashRefreshToken(incomingRefreshToken);

  const refreshSession = await UserRefreshSession.findOne({
    where: {
      refresh_token_hash: refreshTokenHash,
      revoked_at: null,
    },
  });

  if (refreshSession) {
    await refreshSession.update({ revoked_at: new Date() });
    return;
  }

  const user = await User.findOne({
    where: { refresh_token_hash: refreshTokenHash },
  });

  if (user) {
    await user.update({
      refresh_token_hash: null,
      refresh_token_expires_at: null,
    });
  }
};

const getMe = async (nik) => {
  const user = await findUserWithProfile({ nik });

  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  return buildUserPayload(user);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
  buildUserPayload,
  findUserWithProfile,
  register,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  getMe,
};