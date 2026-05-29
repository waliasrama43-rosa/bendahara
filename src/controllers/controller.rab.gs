/**
 * ============================================================
 * CONTROLLER RAB - Rencana Anggaran Belanja (per BULAN)
 * Fase 5: Pecah RKKAL tahunan -> alokasi 12 bulan + approval
 * ============================================================
 */

var Controller = (typeof Controller !== 'undefined' && Controller) ? Controller : {};

Controller.RAB = {

  BULAN: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
  BULAN_FULL: ['Januari','Februari','Maret','April','Mei','Juni','Juli',
               'Agustus','September','Oktober','November','Desember'],

  /**
   * generate - buat RAB dari semua item RKKAL sekolah utk 1 tahun
   * mode: 'rata' (bagi 12 sama) | 'kosong' (semua 0, isi manual nanti)
   */
  generate: function(params) {
    try {
      const schoolId = params.schoolId || '';
      const tahun    = parseInt(params.tahun || params.tahunAnggaran) || new Date().getFullYear();
      const mode     = params.mode || 'rata';

      if (!schoolId) {
        return Response.json({ status:'error', message:'School ID wajib diisi' });
      }

      const rkkalRows = Database.findBy(DB_CONFIG.SHEETS.RKKAL, 'School_ID', schoolId)
                                .filter(r => r['Tahun_Anggaran'] == tahun);
      if (!rkkalRows.length) {
        return Response.json({ status:'warning',
          message:'Data RKKAL tahun '+tahun+' tidak ditemukan. Upload/input RKKAL dulu.' });
      }

      // Hapus RAB lama tahun ini (regenerate bersih)
      const oldRab = Database.findBy(DB_CONFIG.SHEETS.RAB, 'School_ID', schoolId)
                             .filter(r => r['Tahun_Anggaran'] == tahun);
      oldRab.forEach(r => Database.deleteRow(DB_CONFIG.SHEETS.RAB, 'RAB_ID', r['RAB_ID']));

      const rabRows = rkkalRows.map((rk, i) => this._buildRabRow(rk, schoolId, tahun, mode, i));
      const inserted = Database.insertBatch(DB_CONFIG.SHEETS.RAB, rabRows);

      Database.logEvent('INFO','RAB.generate',
        'RAB '+tahun+' dibuat: '+inserted+' item (mode: '+mode+')','',schoolId);

      return Response.json({
        status:'success',
        message:'RAB berhasil dibuat: '+inserted+' item anggaran dipecah ke 12 bulan',
        data:{ tahun: tahun, mode: mode, total_item: inserted }
      });
    } catch(err) {
      Logger.log('RAB.generate ERROR: '+err.message);
      return Response.json({ status:'error', message:'Gagal membuat RAB: '+err.message });
    }
  },

  _buildRabRow: function(rk, schoolId, tahun, mode, idx) {
    const pagu = parseFloat(rk['Pagu_Anggaran']) || 0;
    const row = {
      RAB_ID         : 'RAB-'+Date.now()+'-'+idx,
      School_ID      : schoolId,
      RKKAL_ID       : rk['RKKAL_ID'] || '',
      Tahun_Anggaran : tahun,
      Kode_Akun      : rk['Kode_Akun'] || '',
      Uraian         : rk['Uraian'] || '',
      Pagu_Tahunan   : pagu,
      Total_Alokasi  : 0,
      Selisih_Pagu   : pagu,
      Status_RAB     : 'draft',
      Approved_By    : '',
      Approved_Date  : '',
      Timestamp      : new Date().toISOString(),
      Catatan        : ''
    };
    let totalAlok = 0;
    this.BULAN.forEach((b, i) => {
      let nilai = 0;
      if (mode === 'rata') {
        nilai = (i === 11) ? (pagu - Math.floor(pagu/12)*11) : Math.floor(pagu/12);
      }
      row['Alokasi_'+b] = nilai;
      totalAlok += nilai;
    });
    row.Total_Alokasi = totalAlok;
    row.Selisih_Pagu  = pagu - totalAlok;
    return row;
  }
};


// ── GET: ambil RAB 1 tahun (semua item) ────────────────────
Controller.RAB.getByYear = function(schoolId, tahun) {
  return Database.findBy(DB_CONFIG.SHEETS.RAB, 'School_ID', schoolId)
                 .filter(r => r['Tahun_Anggaran'] == tahun);
};

// ── GET via endpoint (JSON utk frontend) ────────────────────
Controller.RAB.list = function(params) {
  try {
    const schoolId = params.schoolId || '';
    const tahun    = parseInt(params.tahun) || new Date().getFullYear();
    const rows = Controller.RAB.getByYear(schoolId, tahun);

    // Ringkasan
    const totalPagu  = rows.reduce((s,r)=>s+(parseFloat(r['Pagu_Tahunan'])||0),0);
    const totalAlok  = rows.reduce((s,r)=>s+(parseFloat(r['Total_Alokasi'])||0),0);
    const approved   = rows.filter(r => r['Status_RAB']==='approved').length;

    return Response.json({
      success:true,
      data:{
        items: rows,
        summary:{
          total_item   : rows.length,
          total_pagu   : totalPagu,
          total_alokasi: totalAlok,
          selisih      : totalPagu - totalAlok,
          approved     : approved,
          draft        : rows.length - approved,
          formatted_pagu: 'Rp '+totalPagu.toLocaleString('id-ID'),
          formatted_alok: 'Rp '+totalAlok.toLocaleString('id-ID')
        }
      }
    });
  } catch(err) {
    return Response.json({ success:false, error: err.message });
  }
};

// ── UPDATE alokasi 1 item (set nilai per bulan manual) ──────
Controller.RAB.updateAllocation = function(params) {
  try {
    const rabId = params.rabId || params.rab_id;
    const row   = Database.findOneBy(DB_CONFIG.SHEETS.RAB, 'RAB_ID', rabId);
    if (!row) return Response.json({ status:'error', message:'Item RAB tidak ditemukan' });
    if (row['Status_RAB'] === 'approved') {
      return Response.json({ status:'error', message:'RAB sudah disetujui, tidak bisa diubah' });
    }

    const pagu = parseFloat(row['Pagu_Tahunan']) || 0;
    const upd  = {};
    let total  = 0;
    Controller.RAB.BULAN.forEach(b => {
      const key = 'alokasi_'+b.toLowerCase();
      const val = params[key] !== undefined ? (parseFloat(params[key])||0) : (parseFloat(row['Alokasi_'+b])||0);
      upd['Alokasi_'+b] = val;
      total += val;
    });
    upd['Total_Alokasi'] = total;
    upd['Selisih_Pagu']  = pagu - total;

    const ok = Database.update(DB_CONFIG.SHEETS.RAB, 'RAB_ID', rabId, upd);
    return Response.json({
      status: ok ? 'success':'error',
      message: ok ? 'Alokasi RAB diperbarui' : 'Gagal update',
      data:{ total_alokasi: total, selisih: pagu - total,
             warning: total > pagu ? 'Alokasi melebihi pagu tahunan!' : null }
    });
  } catch(err) {
    Logger.log('RAB.updateAllocation ERROR: '+err.message);
    return Response.json({ status:'error', message: err.message });
  }
};

// ── APPROVE RAB (oleh Kepala Sekolah) ───────────────────────
Controller.RAB.approve = function(params) {
  try {
    const schoolId = params.schoolId || '';
    const tahun    = parseInt(params.tahun) || new Date().getFullYear();
    const approver = params.approvedBy || 'Kepala Sekolah';
    const rabId    = params.rabId || '';

    const rows = rabId
      ? [Database.findOneBy(DB_CONFIG.SHEETS.RAB,'RAB_ID',rabId)].filter(Boolean)
      : Controller.RAB.getByYear(schoolId, tahun);

    if (!rows.length) return Response.json({ status:'error', message:'Tidak ada RAB untuk disetujui' });

    let approved = 0;
    rows.forEach(r => {
      const ok = Database.update(DB_CONFIG.SHEETS.RAB,'RAB_ID',r['RAB_ID'],{
        Status_RAB:'approved', Approved_By:approver,
        Approved_Date:new Date().toISOString()
      });
      if (ok) approved++;
    });

    Database.logEvent('INFO','RAB.approve',
      approved+' item RAB disetujui oleh '+approver,'',schoolId);

    return Response.json({
      status:'success',
      message: approved+' item RAB berhasil disetujui oleh '+approver,
      data:{ approved: approved }
    });
  } catch(err) {
    Logger.log('RAB.approve ERROR: '+err.message);
    return Response.json({ status:'error', message: err.message });
  }
};

// ── Cek sisa anggaran bulan tertentu (dipakai modul Belanja) ─
Controller.RAB.getSisaBulan = function(schoolId, tahun, namaBulan, kodeAkun) {
  try {
    const idx = Controller.RAB.BULAN_FULL.indexOf(namaBulan);
    if (idx === -1) return { found:false };
    const kol = 'Alokasi_'+Controller.RAB.BULAN[idx];
    const rab = Controller.RAB.getByYear(schoolId, tahun)
                          .find(r => r['Kode_Akun'] === kodeAkun);
    if (!rab) return { found:false };
    const alokasi = parseFloat(rab[kol]) || 0;
    return { found:true, alokasi: alokasi, status: rab['Status_RAB'], rabId: rab['RAB_ID'] };
  } catch(e) {
    return { found:false, error:e.message };
  }
};
