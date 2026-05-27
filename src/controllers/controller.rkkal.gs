/**
 * ============================================================
 * CONTROLLER RKKAL - Upload & Parsing
 * Fase 2: Full CSV parsing sesuai format RKKAL 2026
 * ============================================================
 */

const Controller = (typeof Controller !== 'undefined') ? Controller : {};

Controller.RKKAL = {
  Upload: {
    /**
     * Main entry: process uploaded CSV / JSON content
     */
    process: function(params) {
      try {
        const fileContent = params.csvData || params.file || '';
        const schoolId    = params.schoolId || 'UNKNOWN';
        const tahun       = parseInt(params.tahunAnggaran) || 2026;

        if (!fileContent || fileContent.trim() === '') {
          return Response.json({ status:'error', message:'Konten file kosong' });
        }

        // 1. Parse CSV
        const rawRows = this.parseCSV(fileContent);
        if (rawRows.length < 2) {
          return Response.json({ status:'error', message:'File tidak memiliki data yang cukup' });
        }

        // 2. Map to RKKAL objects
        const rkkalRows = this.mapToRKKAL(rawRows, schoolId, tahun);

        // 3. Validate each row
        const valid   = rkkalRows.filter(r => r._valid);
        const invalid = rkkalRows.filter(r => !r._valid);

        // 4. Batch insert
        const inserted = Database.insertBatch(DB_CONFIG.SHEETS.RKKAL, valid);

        // 5. Log
        Database.logEvent('INFO','RKKAL.Upload',
          `Upload selesai: ${inserted} baris berhasil, ${invalid.length} gagal`,
          JSON.stringify(invalid.map(r=>r._reason).slice(0,10)),
          schoolId);

        return Response.json({
          status    : inserted > 0 ? 'success' : 'warning',
          message   : `${inserted} baris RKKAL berhasil diimpor`,
          data: {
            total_rows    : rawRows.length - 1,
            rows_valid    : valid.length,
            rows_inserted : inserted,
            rows_invalid  : invalid.length,
            sample_errors : invalid.slice(0,5).map(r => r._reason)
          }
        });

      } catch(err) {
        Logger.log('RKKAL.Upload ERROR: '+err.message);
        return Response.json({ status:'error', message:'Gagal memproses RKKAL: '+err.message });
      }
    },

    // ── CSV Parser ──────────────────────────────────────────
    parseCSV: function(content) {
      const lines = content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
      return lines
        .filter(l => l.trim() !== '')
        .map(line => {
          const row = [];
          let cur = '', inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; }
            else if (c === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
            else { cur += c; }
          }
          row.push(cur.trim());
          return row;
        });
    },

    // ── Map raw rows to RKKAL schema ────────────────────────
    mapToRKKAL: function(rows, schoolId, tahun) {
      const results = [];
      // rows[0] = header row, skip it
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        // RKKAL CSV columns (from 01_SRT3 RKKAL 2026NEW.csv):
        // [0] KODE  [1] PROGRAM/KEGIATAN  [2] VOLUME  [3] PKT
        // [4] HARGA SATUAN  [5] JUMLAH BIAYA
        const kode   = (r[0] || '').trim();
        const uraian = (r[1] || '').trim();
        const volume = this._cleanNum(r[2]);
        const satuan = (r[3] || '').trim();
        const harga  = this._cleanNum(r[4]);
        const pagu   = this._cleanNum(r[5]);

        if (!kode && !uraian) continue; // skip blank rows

        const isValid = kode.length > 0 || uraian.length > 3;
        results.push({
          RKKAL_ID        : 'RKKAL-'+Date.now()+'-'+i,
          School_ID       : schoolId,
          Tahun_Anggaran  : tahun,
          Kode_Program    : kode.length >= 4 ? kode.substring(0,4) : kode,
          Kode_Kegiatan   : kode.length >= 7 ? kode.substring(4,7) : '',
          Kode_Komponen   : r[2] || '',
          Kode_Akun       : kode,
          Uraian          : uraian,
          Volume          : volume,
          Satuan          : satuan,
          Harga_Satuan    : harga,
          Pagu_Anggaran   : pagu,
          Realisasi_Jan:0,Realisasi_Feb:0,Realisasi_Mar:0,Realisasi_Apr:0,
          Realisasi_Mei:0,Realisasi_Jun:0,Realisasi_Jul:0,Realisasi_Agu:0,
          Realisasi_Sep:0,Realisasi_Okt:0,Realisasi_Nov:0,Realisasi_Des:0,
          Total_Realisasi : 0,
          Sisa_Anggaran   : pagu,
          Persen_Realisasi: 0,
          _valid  : isValid,
          _reason : isValid ? '' : `Row ${i}: kode dan uraian kosong`
        });
      }
      return results;
    },

    _cleanNum: function(val) {
      if (!val) return 0;
      const s = val.toString().replace(/[^0-9.]/g,'');
      return parseFloat(s) || 0;
    }
  },

  /**
   * getTemplate – return RKKAL pagu for a school
   */
  getTemplate: function(schoolId, tahun) {
    return Database.findBy(DB_CONFIG.SHEETS.RKKAL, 'School_ID', schoolId)
      .filter(r => r['Tahun_Anggaran'] == tahun);
  },

  /**
   * updateRealisasi – update monthly realisasi column after transaction
   */
  updateRealisasi: function(rkkalId, bulan, jumlah) {
    try {
      const bulanMap = {
        'Januari':'Realisasi_Jan','Februari':'Realisasi_Feb','Maret':'Realisasi_Mar',
        'April':'Realisasi_Apr','Mei':'Realisasi_Mei','Juni':'Realisasi_Jun',
        'Juli':'Realisasi_Jul','Agustus':'Realisasi_Agu','September':'Realisasi_Sep',
        'Oktober':'Realisasi_Okt','November':'Realisasi_Nov','Desember':'Realisasi_Des'
      };
      const col = bulanMap[bulan];
      if (!col) return false;
      const row = Database.findOneBy(DB_CONFIG.SHEETS.RKKAL,'RKKAL_ID',rkkalId);
      if (!row) return false;
      const newVal = (parseFloat(row[col]) || 0) + jumlah;
      const totalReal = Object.values(bulanMap)
        .reduce((s,c) => s + (c === col ? newVal : (parseFloat(row[c])||0)), 0);
      const pagu = parseFloat(row['Pagu_Anggaran']) || 0;
      return Database.update(DB_CONFIG.SHEETS.RKKAL,'RKKAL_ID',rkkalId,{
        [col]: newVal,
        Total_Realisasi : totalReal,
        Sisa_Anggaran   : pagu - totalReal,
        Persen_Realisasi: pagu > 0 ? Math.round(totalReal/pagu*100) : 0
      });
    } catch(e) {
      Logger.log('RKKAL.updateRealisasi ERROR: '+e.message);
      return false;
    }
  }
};

// ── Legacy helpers ──────────────────────────────────────────
function validateAndProcessRow(row, schoolId) {
  const isValid = !!(row.kodeAkun || row.kode_akun) && !!(row.jenisBelanja || row.uraian);
  if (!isValid) return { success:false, error:'Data tidak valid' };
  const data = {
    ID_Transaksi     : 'TRX-'+Date.now()+'-'+Math.random().toString(36).substr(2,6).toUpperCase(),
    School_ID        : schoolId,
    Kode_Anggaran    : row.kodeAkun || row.kode_akun || '',
    Uraian_MAK       : row.jenisBelanja || row.uraian || '',
    Jumlah_Rupiah    : parseFloat(row.jumlah) || 0,
    Timestamp        : new Date().toISOString(),
    Status_Verifikasi: 'pending'
  };
  Database.insert(DB_CONFIG.SHEETS.TRANSACTIONS, data);
  return { success:true, id:data.ID_Transaksi };
}

function validateRKKALRow(row) {
  return !!(row.kodeAkun && row.jenisBelanja);
}

function generateTransactionId() {
  return 'TRX-'+Date.now()+'-'+Math.random().toString(36).substr(2,9).toUpperCase();
}
