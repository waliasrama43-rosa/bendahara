/**
 * UTILITIES.GS
 * Kumpulan fungsi utility untuk Sistem ERP Keuangan Sekolah Rakyat
 * 
 * @author Sistem ERP Sekolah Rakyat
 * @version 1.0.0
 */

/* VALIDATION UTILITIES */

/**
 * validateNamaToko - Validasi nama sekolah/toko
 */
function validateNamaToko(nama) {
  if (!nama || nama.trim() === '') {
    return {
      valid: false,
      message: 'NAMA TOKO tidak boleh kosong'
    };
  }
  
  if (nama.length > 200) {
    return {
      valid: false,
      message: 'NAMA TOKO maksimal 200 karakter'
    };
  }
  
  return { valid: true, message: '' };
}

/**
 * validateUraianMak - Validasi uraian MAK
 */
function validateUraianMak(uraian) {
  if (!uraian || uraian.trim() === '') {
    return {
      valid: false,
      message: 'URAIAN MAK tidak boleh kosong'
    };
  }
  
  // Check if contains at least a code pattern
  const codePattern = /\d{6}/;
  if (!codePattern.test(uraian)) {
    return {
      valid: false,
      message: 'URAIAN MAK harus mengandung kode anggaran (6 digit)'
    };
  }
  
  return { valid: true, message: '' };
}

/**
 * validateJumlah - Validasi jumlah rupiah
 */
function validateJumlah(jumlah) {
  const num = parseFloat(jumlah);
  
  if (isNaN(num)) {
    return {
      valid: false,
      message: 'JUMLAH harus berupa angka'
    };
  }
  
  if (num < 0) {
    return {
      valid: false,
      message: 'JUMLAH tidak boleh negatif'
    };
  }
  
  if (num > 1000000000000) { // 1 triliun
    return {
      valid: false,
      message: 'JUMLAH terlalu besar (maks 1 triliun)'
    };
  }
  
  return { valid: true, message: '' };
}

/* FORMATTING UTILITIES */

/**
 * formatRupiah - Format angka ke format rupiah Indonesia
 */
function formatRupiah(angka) {
  try {
    const number = parseFloat(angka);
    if (isNaN(number)) return 'Rp 0';
    
    return 'Rp ' + number.toLocaleString('id-ID');
  } catch (error) {
    return 'Rp ' + angka;
  }
}

/**
 * formatTanggal - Format tanggal Indonesia
 */
function formatTanggal(tanggal) {
  try {
    if (!tanggal) return '';
    
    const date = new Date(tanggal);
    if (isNaN(date.getTime())) return tanggal;
    
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('id-ID', options);
  } catch (error) {
    return tanggal;
  }
}

/* DATA PROCESSING UTILITIES */

/**
 * generateNoUrut - Generate nomor urut otomatis
 */
function generateNoUrut(sheet) {
  try {
    if (!sheet) return 1;
    
    const lastRow = sheet.getLastRow();
    
    // If only header exists
    if (lastRow <= 1) return 1;
    
    // Get last NO value
    const lastNo = sheet.getRange(lastRow, 1).getValue();
    return parseInt(lastNo) + 1;
    
  } catch (error) {
    return 1;
  }
}

/**
 * generateBulanList - Generate daftar bulan untuk dropdown
 */
function generateBulanList() {
  return [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];
}

/**
 * generateTahunAnggaranList - Generate daftar tahun (3 tahun terakhir dan depan)
 */
function generateTahunAnggaranList() {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = -1; i <= 2; i++) {
    years.push(currentYear + i);
  }
  
  return years.sort((a, b) => b - a); // Descending order
}

/* ERROR HANDLING UTILITIES */

/**
 * createUserFriendlyError - Create user-friendly error message
 */
function createUserFriendlyError(error) {
  const errorMessages = {
    'Sistem ERP Keuangan Sekolah Rakyat': 'Sistem sedang offline. Silakan coba beberapa saat lagi.',
    'database': 'Database tidak dapat diakses. Sistem akan mencoba memperbaiki otomatis.',
    'permission': 'Izin tidak cukup. Pastikan Anda memiliki akses ke Google Sheet.',
    'quota': 'Batas kuota tercapai. Silakan coba lagi nanti.'
  };
  
  const errorMessage = error.message.toLowerCase();
  
  for (const [key, message] of Object.entries(errorMessages)) {
    if (errorMessage.includes(key.toLowerCase())) {
      return message;
    }
  }
  
  return 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi administrator.';
}

/**
 * safeExecute - Execute function dengan error handling
 */
function safeExecute(func, ...args) {
  try {
    return {
      success: true,
      result: func(...args),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error
    };
  }
}

/* SECURITY UTILITIES */

/**
 * sanitizeInput - Sanitize input untuk mencegah XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * validateInputLength - Validasi panjang input
 */
function validateInputLength(input, maxLength, fieldName) {
  if (input && input.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} maksimal ${maxLength} karakter`
    };
  }
  
  return { valid: true, message: '' };
}

/* EXPORT UTILITIES */

/**
 * convertToExcelDate - Convert date untuk format Excel
 */
function convertToExcelDate(date) {
  try {
    if (!date) return '';
    
    const excelEpoch = new Date(1899, 11, 30);
    const inputDate = new Date(date);
    
    const diff = inputDate - excelEpoch;
    const days = diff / (1000 * 60 * 60 * 24);
    
    return days;
  } catch (error) {
    return date;
  }
}

/**
 * createDownloadLink - Create download link untuk file
 */
function createDownloadLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/* TESTING UTILITIES */

/**
 * runAllValidations - Run semua validasi sekaligus
 */
function runAllValidations(data) {
  const validations = [
    validateNamaToko(data.nama_toko),
    validateUraianMak(data.uraian_mak),
    validateJumlah(data.jumlah)
  ];
  
  const errors = validations
    .filter(v => !v.valid)
    .map(v => v.message);
    
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * createTestData - Create data test untuk pengembangan
 */
function createTestData(count = 5) {
  const schools = [
    'SDN 01 Jakarta Pusat',
    'SDN 02 Bandung',
    'SDN 03 Surabaya',
    'MI Al-Huda',
    'SMP Negeri 1 Bogor'
  ];
  
  const uraianMakList = [
    '521111 - Belanja Keperluan Perkantoran',
    '521211 - Belanja Bahan Habis Pakai',
    '522111 - Belanja Langganan Listrik',
    '523111 - Belanja Perjalanan Dinas',
    '524111 - Belanja Modal Peralatan'
  ];
  
  const months = generateBulanList();
  
  const testData = [];
  
  for (let i = 0; i < count; i++) {
    testData.push({
      nama_toko: schools[i % schools.length],
      uraian_mak: uraianMakList[i % uraianMakList.length],
      uraian_pembayaran: `Testing data ke-${i + 1} untuk validation`,
      tahun_anggaran: 2026,
      bulan_pelaksanaan: months[i % months.length],
      jumlah: (i + 1) * 1000000
    });
  }
  
  return testData;
}