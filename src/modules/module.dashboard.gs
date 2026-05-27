/**
 * ============================================================
 * MODULE DASHBOARD - Analytics & Real-time Stats
 * Fase 4: Dashboard lengkap dengan grafik data & KPI
 * ============================================================
 */

const Dashboard = {

  // ── Main dashboard data ───────────────────────────────────
  getData: function(schoolId, tahun) {
    try {
      tahun = tahun || new Date().getFullYear();

      const trxAll   = schoolId
        ? Database.findBy(DB_CONFIG.SHEETS.TRANSACTIONS,'School_ID', schoolId)
        : Database.getAll(DB_CONFIG.SHEETS.TRANSACTIONS);

      const trxTahun = trxAll.filter(t => {
        const ts = t['Tahun_Anggaran'] || (t['Timestamp'] ? new Date(t['Timestamp']).getFullYear() : 0);
        return parseInt(ts) === parseInt(tahun);
      });

      const bulanStats = this._buildBulanStats(trxTahun);
      const makStats   = this._buildMAKStats(trxTahun);
      const statusDist = this._buildStatusDist(trxTahun);

      const totalJumlah   = trxTahun.reduce((s,t) => s+(parseFloat(t['Jumlah_Rupiah'])||0), 0);
      const verifiedJumlah= trxTahun.filter(t=>t['Status_Verifikasi']==='verified')
                                     .reduce((s,t)=>s+(parseFloat(t['Jumlah_Rupiah'])||0),0);

      // RKKAL summary
      const rkkalSummary = this._getRKKALSummary(schoolId, tahun);

      return {
        success: true,
        data: {
          summary: {
            total_transaksi  : trxTahun.length,
            total_jumlah     : totalJumlah,
            verified_jumlah  : verifiedJumlah,
            pending_count    : trxTahun.filter(t=>t['Status_Verifikasi']==='pending').length,
            verified_count   : trxTahun.filter(t=>t['Status_Verifikasi']==='verified').length,
            rejected_count   : trxTahun.filter(t=>t['Status_Verifikasi']==='rejected').length,
            formatted_total  : 'Rp '+totalJumlah.toLocaleString('id-ID'),
            formatted_verified:'Rp '+verifiedJumlah.toLocaleString('id-ID'),
            tahun            : tahun
          },
          bulan_chart  : bulanStats,
          mak_chart    : makStats,
          status_pie   : statusDist,
          rkkal_summary: rkkalSummary,
          last_updated : new Date().toISOString()
        }
      };

    } catch(err) {
      Logger.log('Dashboard.getData ERROR: '+err.message);
      return { success:false, error: err.message };
    }
  },

  // ── Monthly trend ─────────────────────────────────────────
  _buildBulanStats: function(trxList) {
    const months = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
    const result = {};
    months.forEach(m => result[m] = { count:0, total:0 });
    trxList.forEach(t => {
      const b = t['Bulan_Pelaksanaan'] || '';
      if (result[b] !== undefined) {
        result[b].count++;
        result[b].total += parseFloat(t['Jumlah_Rupiah'])||0;
      }
    });
    return result;
  },

  // ── Top MAK spending ──────────────────────────────────────
  _buildMAKStats: function(trxList) {
    const map = {};
    trxList.forEach(t => {
      const kode = (t['Kode_Anggaran']||'LAINNYA').substring(0,6);
      if (!map[kode]) map[kode] = { count:0, total:0, label:t['Uraian_MAK']||kode };
      map[kode].count++;
      map[kode].total += parseFloat(t['Jumlah_Rupiah'])||0;
    });
    // Sort by total desc, top 10
    return Object.entries(map)
      .sort((a,b) => b[1].total - a[1].total)
      .slice(0,10)
      .map(([kode,v]) => ({ kode, ...v, formatted_total:'Rp '+v.total.toLocaleString('id-ID') }));
  },

  // ── Status distribution ───────────────────────────────────
  _buildStatusDist: function(trxList) {
    const map = { pending:0, verified:0, rejected:0, other:0 };
    trxList.forEach(t => {
      const s = (t['Status_Verifikasi']||'other').toLowerCase();
      if (map[s] !== undefined) map[s]++;
      else map.other++;
    });
    return map;
  },

  // ── RKKAL realisasi summary ───────────────────────────────
  _getRKKALSummary: function(schoolId, tahun) {
    try {
      const rkkalData = schoolId
        ? Database.findBy(DB_CONFIG.SHEETS.RKKAL,'School_ID',schoolId).filter(r=>r['Tahun_Anggaran']==tahun)
        : [];
      const totalPagu  = rkkalData.reduce((s,r)=>s+(parseFloat(r['Pagu_Anggaran'])||0),0);
      const totalReal  = rkkalData.reduce((s,r)=>s+(parseFloat(r['Total_Realisasi'])||0),0);
      const persen     = totalPagu>0 ? Math.round(totalReal/totalPagu*100) : 0;
      return {
        total_pagu    : totalPagu,
        total_realisasi: totalReal,
        sisa          : totalPagu - totalReal,
        persen_serap  : persen,
        formatted_pagu: 'Rp '+totalPagu.toLocaleString('id-ID'),
        formatted_real: 'Rp '+totalReal.toLocaleString('id-ID'),
        rkkal_items   : rkkalData.length
      };
    } catch(e) { return {}; }
  },

  // ── Multi-school aggregate (admin dashboard) ──────────────
  getAdminSummary: function() {
    try {
      const schools = Database.getAll(DB_CONFIG.SHEETS.SCHOOLS);
      const allTrx  = Database.getAll(DB_CONFIG.SHEETS.TRANSACTIONS);
      const totalAmount = allTrx.reduce((s,t)=>s+(parseFloat(t['Jumlah_Rupiah'])||0),0);

      return {
        success: true,
        data: {
          total_schools    : schools.length,
          active_schools   : schools.filter(s=>s['Status_Aktif']==='aktif').length,
          total_transactions: allTrx.length,
          total_amount     : totalAmount,
          formatted_total  : 'Rp '+totalAmount.toLocaleString('id-ID'),
          school_stats     : schools.slice(0,20).map(s => ({
            id    : s['School_ID'],
            nama  : s['Nama_Sekolah'],
            trx   : allTrx.filter(t=>t['School_ID']===s['School_ID']).length,
            amount: allTrx.filter(t=>t['School_ID']===s['School_ID'])
                           .reduce((sum,t)=>sum+(parseFloat(t['Jumlah_Rupiah'])||0),0)
          })),
          timestamp: new Date().toISOString()
        }
      };
    } catch(err) {
      return { success:false, error: err.message };
    }
  },

  // ── Budget alert checker (trigger harian) ────────────────
  checkBudgetAlerts: function() {
    try {
      const rkkalAll = Database.getAll(DB_CONFIG.SHEETS.RKKAL);
      rkkalAll.forEach(r => {
        const persen = parseFloat(r['Persen_Realisasi'])||0;
        if (persen >= 75) {
          TelegramBot.sendBudgetAlert(
            r['School_ID'],
            r['Kode_Akun'],
            persen,
            parseFloat(r['Sisa_Anggaran'])||0
          );
        }
      });
      Logger.log('Budget alert check selesai: '+rkkalAll.length+' RKKAL items diperiksa');
    } catch(err) {
      Logger.log('checkBudgetAlerts ERROR: '+err.message);
    }
  }
};
