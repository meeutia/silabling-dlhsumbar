const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { assertWorksheetFileSignature } = require('../utils/file-signature.util');

/**
 * BASE DIR
 * Semua file upload disimpan di folder:
 * backend/uploads/...
 *
 * Pastikan di server/app.js ada:
 * app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
 */
const UPLOAD_ROOT_DIR = path.join(process.cwd(), 'uploads');

const WORKSHEET_DIR = path.join(UPLOAD_ROOT_DIR, 'worksheets');
const PAYMENT_PROOF_DIR = path.join(UPLOAD_ROOT_DIR, 'bukti-bayar');

fs.mkdirSync(WORKSHEET_DIR, { recursive: true });
fs.mkdirSync(PAYMENT_PROOF_DIR, { recursive: true });

const sanitizeFilenamePart = (value, fallback = 'file') => {
  return String(value || fallback)
    .replace(/[\\/:"*?<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 80)
    .trim() || fallback;
};



/**
 * =========================================================
 * BUKTI PEMBAYARAN MANUAL
 * =========================================================
 */
const paymentProofAllowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PAYMENT_PROOF_DIR);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeRequestId = sanitizeFilenamePart(req.params?.id, 'registrasi');
    const safeUserId = sanitizeFilenamePart(req.user?.nik || req.user?.id || req.user?.id_user, 'user');
    const baseName = sanitizeFilenamePart(path.basename(file.originalname || 'bukti-bayar', ext), 'bukti-bayar');

    cb(null, `bukti_bayar_${safeRequestId}_${safeUserId}_${Date.now()}_${Math.round(Math.random() * 1e9)}_${baseName}${ext}`);
  },
});

const uploadPaymentProofFiles = multer({
  storage: paymentProofStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (!paymentProofAllowedExtensions.has(ext)) {
      return cb(new Error('Bukti pembayaran harus berformat PDF, JPG, JPEG, PNG, atau WEBP.'));
    }

    return cb(null, true);
  },
});

const uploadPaymentProofFile = (req, res, next) => {
  const uploader = uploadPaymentProofFiles.single('buktiBayar');

  uploader(req, res, (error) => {
    if (!error) {
      if (req.file) {
        req.file.relativePath = `/uploads/bukti-bayar/${req.file.filename}`;
      }
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Ukuran bukti pembayaran maksimal 5 MB.',
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Upload bukti pembayaran tidak valid.',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Bukti pembayaran tidak valid.',
    });
  });
};

/**
 * =========================================================
 * WORKSHEET / LKA UPLOAD
 * =========================================================
 */
const worksheetAllowedExtensions = new Set([
  '.pdf',
  '.xls',
  '.xlsx',
  '.xlsm',
  '.csv',
  '.doc',
  '.docx',
]);

const worksheetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, WORKSHEET_DIR);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();

    const baseName = sanitizeFilenamePart(
      path.basename(file.originalname || 'worksheet', ext),
      'worksheet'
    );

    const safeDetailId = sanitizeFilenamePart(req.params?.idPenugasanDetail, 'detail');
    const safeUserId = sanitizeFilenamePart(req.user?.nik || req.user?.id || req.user?.id_user, 'user');

    const uniqueName = `worksheet_${safeDetailId}_${safeUserId}_${Date.now()}_${Math.round(
      Math.random() * 1e9
    )}_${baseName}${ext}`;

    cb(null, uniqueName);
  },
});

const uploadWorksheetFiles = multer({
  storage: worksheetStorage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (!worksheetAllowedExtensions.has(ext)) {
      return cb(
        new Error('File LKA harus berformat PDF, XLS, XLSX, XLSM, CSV, DOC, atau DOCX.')
      );
    }

    // Browser/WPS/LibreOffice kadang mengirim MIME Office sebagai application/zip,
    // application/octet-stream, atau bahkan kosong. Validasi utama tetap memakai
    // ekstensi + isi file pada validateWorksheetFileSignatures agar upload tidak
    // gagal hanya karena MIME dari browser tidak standar.
    return cb(null, true);
  },
});


const uploadWorksheetFileFields = (req, res, next) => {
  const uploader = uploadWorksheetFiles.fields([
    { name: 'files', maxCount: 10 },
    { name: 'worksheetFiles', maxCount: 10 },
    { name: 'file', maxCount: 10 },
    { name: 'worksheetFile', maxCount: 10 },
    { name: 'lkaFile', maxCount: 10 },
  ]);

  uploader(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Ukuran file worksheet maksimal 15 MB per file.',
        });
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Jumlah file worksheet maksimal 10 file.',
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Upload worksheet tidak valid.',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'File worksheet tidak valid.',
    });
  });
};


const flattenUploadedFiles = (files, file) => {
  const rows = Array.isArray(files) ? [...files] : Object.values(files || {}).flat();
  if (file) rows.push(file);
  return rows.filter(Boolean);
};

const removeUploadedFiles = async (files = []) => {
  await Promise.all(
    files
      .map((file) => file?.path)
      .filter(Boolean)
      .map((filePath) => fs.promises.unlink(filePath).catch(() => null))
  );
};

const validateWorksheetFileSignatures = async (req, res, next) => {
  const uploadedFiles = flattenUploadedFiles(req.files, req.file);

  try {
    for (const file of uploadedFiles) {
      await assertWorksheetFileSignature(file.path, file.originalname || file.filename);
    }

    return next();
  } catch (error) {
    await removeUploadedFiles(uploadedFiles);

    return res.status(400).json({
      success: false,
      message: error.message || 'Isi file LKA tidak valid.',
    });
  }
};

module.exports = {
  uploadPaymentProofFile,
  uploadPaymentProofFiles,
  uploadWorksheetFiles,
  uploadWorksheetFileFields,
  validateWorksheetFileSignatures,
};