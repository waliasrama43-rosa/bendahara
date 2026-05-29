/**
 * ============================================================
 * CONTROLLER EXPORT - Laporan Excel / PDF
 * Fase 2: Export SPJ format Sekolah Rakyat + Rekap Realisasi
 * ============================================================
 */

var Controller = (typeof Controller !== 'undefined' && Controller) ? Controller : {};

Controller.Export = {

  process: function(params) {
    try {
      const schoolId = params.schoolId || '';
      const period   = params.period   || '*';
      const format   = params.format   || 'spj'; // spj | realisasi | rkkal

      let result;
      switch(format) {
        case 'realisasi': result = this.exportRealisasi(schoolId, period); break;
        case 'rkkal'    : result = this.exportRKKAL(schoolId, period);     break;
        default         : result = this.exportSPJ(schoolId, period);
      }

      return Response.json(result);
    } catch(err) {
      Logger.log('Export.process ERROR: '+err.message);
      return Response.json({ status:'error', message:'Gagal membuat laporan: '+err.message });
    }
  },

  // ── Export SPJ (Surat Pertanggungjawaban) ─────────────────
  exportSPJ: function(schoolId, period) {
    try {
      const transactions = Database.getTransactionsBySchool(schoolId, period);
      if (transactions.length === 0) {
        return { status:'warning', message:'Tidak ada data transaksi untuk periode ini' };
      }

      const exportName = `Rekap_SPJ_${schoolId}_${period}_${Date.now()}`;
      const ss   = SpreadsheetApp.create(exportName);
      const sheet = ss.getActiveSheet();
      sheet.setName('Rekap SPJ');

      // ── HEADER Informasi ──────────────────────────────
      this._mergeWrite(sheet, 1, 1, 1, 8, 'REKAPITULASI SPJ SEKOLAH RAKYAT');
      this._mergeWrite(sheet, 2, 1, 2, 8, 'Periode: ' + period);
      this._mergeWrite(sheet, 3, 1, 3, 8, 'Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID',{dateStyle:'full'}));

      // ── Kolom Header ──────────────────────────────────
      const headers = ['NO','NAMA TOKO','URAIAN MAK (Akun Belanja)','URAIAN PEMBAYARAN',
                       'TAHUN ANGGARAN','BULAN PELAKSANAAN','JUMLAH (Rp)','TERBILANG'];
      sheet.getRange(5, 1, 1, headers.length).setValues([headers]);
      this._styleRow(sheet, 5, headers.length, '#1a237e', '#ffffff');

      // ── Data Rows ─────────────────────────────────────
      let totalJumlah = 0;
      transactions.forEach((t, idx) => {
        const jumlah = parseFloat(t['Jumlah_Rupiah']) || 0;
        totalJumlah += jumlah;
        const row = [
          idx+1,
          t['Nama_Toko'] || '',
          t['Kode_Anggaran'] || t['Uraian_MAK'] || '',
          t['Uraian_Pembayaran'] || t['Nama_Kegiatan'] || '',
          t['Tahun_Anggaran'] || '',
          t['Bulan_Pelaksanaan'] || '',
          jumlah,
          t['Terbilang'] || this.numberToWords(jumlah)
        ];
        const rowNum = idx + 6;
        sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
        if (idx % 2 === 0) sheet.getRange(rowNum,1,1,headers.length).setBackground('#f5f5f5');
      });

      // ── Total row ─────────────────────────────────────
      const totalRow = transactions.length + 6;
      sheet.getRange(totalRow, 1, 1, headers.length).setValues([
        ['','','','','','TOTAL', totalJumlah, this.numberToWords(totalJumlah)]
      ]);
      this._styleRow(sheet, totalRow, headers.length, '#e8f5e9', '#000000');
      sheet.getRange(totalRow, 7).setFontWeight('bold');

      // ── Kolom widths ──────────────────────────────────
      [30,120,200,220,80,100,120,200].forEach((w,i) => sheet.setColumnWidth(i+1, w));
      sheet.setFrozenRows(5);

      // ── Generate download link ────────────────────────
      const fileId = ss.getId();
      const file   = DriveApp.getFileById(fileId);

      return {
        status       : 'success',
        message      : `Laporan SPJ berhasil dibuat (${transactions.length} transaksi)`,
        data: {
          export_name  : exportName,
          file_url     : file.getUrl(),
          download_url : `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
          row_count    : transactions.length,
          total_jumlah : totalJumlah,
          formatted_total: 'Rp '+totalJumlah.toLocaleString('id-ID'),
          period       : period
        }
      };
    } catch(err) {
      Logger.log('exportSPJ ERROR: '+err.message);
      return { status:'error', message: err.message };
    }
  },

  // ── Export Realisasi Bulanan ──────────────────────────────
  exportRealisasi: function(schoolId, tahun) {
    try {
      const rkkalData = Controller.RKKAL.getTemplate(schoolId, tahun || 2026);
      if (!rkkalData.length) {
        return { status:'warning', message:'Data RKKAL tidak ditemukan. Upload RKKAL terlebih dahulu.' };
      }

      const exportName = `Realisasi_Anggaran_${schoolId}_${tahun}`;
      const ss   = SpreadsheetApp.create(exportName);
      const sheet = ss.getActiveSheet();
      sheet.setName('Realisasi Anggaran');

      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      const headers = ['KODE','URAIAN','PAGU ANGGARAN',
                       ...months.map(m=>'REAL '+m), 'TOTAL REALISASI','SISA','% REAL'];

      sheet.getRange(1,1,1,headers.length).setValues([headers]);
      this._styleRow(sheet, 1, headers.length, '#880e4f','#ffffff');

      rkkalData.forEach((r, i) => {
        const realBulan = months.map(m => parseFloat(r['Realisasi_'+m])||0);
        const row = [
          r['Kode_Akun']||'',
          r['Uraian']||'',
          parseFloat(r['Pagu_Anggaran'])||0,
          ...realBulan,
          parseFloat(r['Total_Realisasi'])||0,
          parseFloat(r['Sisa_Anggaran'])||0,
          (parseFloat(r['Persen_Realisasi'])||0)+'%'
        ];
        sheet.getRange(i+2,1,1,row.length).setValues([row]);
      });

      const fileId = ss.getId();
      return {
        status:'success',
        message:`Realisasi anggaran berhasil diekspor`,
        data: {
          file_url: DriveApp.getFileById(fileId).getUrl(),
          download_url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
          row_count: rkkalData.length
        }
      };
    } catch(err) {
      return { status:'error', message: err.message };
    }
  },

  // ── Export RKKAL Template ────────────────────────────────
  exportRKKAL: function(schoolId, tahun) {
    const data = Controller.RKKAL.getTemplate(schoolId, tahun);
    if (!data.length) return { status:'warning', message:'Data RKKAL tidak ditemukan' };
    // reuse exportRealisasi
    return this.exportRealisasi(schoolId, tahun);
  },

  // ── numberToWords (Terbilang Rupiah) ─────────────────────
  numberToWords: function(num) {
    if (!num || num === 0) return 'Nol Rupiah';
    num = Math.floor(Math.abs(num));

    const s  = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan'];
    const b  = ['Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas',
                'Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
    const p  = ['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh',
                'Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];

    function below1000(n) {
      let w = '';
      if (n >= 100) { w += (n>=200 ? s[Math.floor(n/100)]+' ' : '')+'Seratus '; n%=100; }
      if (n >= 20)  { w += p[Math.floor(n/10)]+' '; n%=10; if(n>0) w+=s[n]+' '; }
      else if (n>=10){ w += b[n-10]+' '; }
      else if (n>0)  { w += s[n]+' '; }
      return w;
    }

    let words = '';
    if (num >= 1000000000000) { words += below1000(Math.floor(num/1000000000000))+'Triliun '; num%=1000000000000; }
    if (num >= 1000000000)    { words += below1000(Math.floor(num/1000000000))+'Miliar '; num%=1000000000; }
    if (num >= 1000000)       { words += below1000(Math.floor(num/1000000))+'Juta '; num%=1000000; }
    if (num >= 1000)          { const r=Math.floor(num/1000); words+=(r===1?'Seribu ':below1000(r)+'Ribu '); num%=1000; }
    words += below1000(num);

    return words.trim()+' Rupiah';
  },

  // ── Helpers ───────────────────────────────────────────────
  getMonthName: function(idx) {
    return ['Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'][idx] || '';
  },

  _mergeWrite: function(sheet, r1, c1, r2, c2, text) {
    sheet.getRange(r1,c1,r2-r1+1,c2-c1+1).merge().setValue(text)
         .setFontWeight('bold').setHorizontalAlignment('center');
  },

  _styleRow: function(sheet, row, cols, bg, fg) {
    sheet.getRange(row,1,1,cols).setBackground(bg).setFontColor(fg)
         .setFontWeight('bold').setHorizontalAlignment('center');
  }
};
