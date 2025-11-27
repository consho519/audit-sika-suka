// KONFIGURASI NAMA SHEET (Wajib sama persis dengan di Google Sheet)
const SHEET_MASTER = "Master_Barang";
const SHEET_LOG_VALID = "Log_Temuan_Valid";
const SHEET_LOG_NA = "Log_Temuan_NA";
const SHEET_USER = "Master_User";
const SHEET_CONFIG = "Master_Config_Cabang";

// ==========================================
// 1. KONEKSI & AUTH
// ==========================================

function getDbCabang(namaCabang) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) throw new Error("Sheet Config hilang!");

  const data = sheet.getDataRange().getValues();
  let id = null;
  // Cari ID Spreadsheet berdasarkan nama cabang
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() == String(namaCabang).trim().toLowerCase()) {
      id = String(data[i][1]).trim();
      break;
    }
  }

  if (!id) throw new Error("Cabang " + namaCabang + " belum disetting di Config.");
  // Bersihkan ID jika berupa link lengkap
  if (id.includes("/d/")) id = id.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];

  return SpreadsheetApp.openById(id);
}

function loginUser(u, p) {
  try {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USER);
    const d = s.getDataRange().getValues();
    // Cek User (Col A) & Pass (Col B)
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][0]).toLowerCase() == String(u).toLowerCase() && String(d[i][1]) == String(p)) {
        return { success: true, user: d[i][0], role: d[i][2], cabang: d[i][3] };
      }
    }
    return { success: false, message: "Username/Password Salah" };
  } catch (e) { return { success: false, message: e.message }; }
}

function getDaftarCabang(userEmail) {
  // Ambil list cabang yang diizinkan untuk user tersebut
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(SHEET_USER);
  const sConfig = ss.getSheetByName(SHEET_CONFIG);
  
  let allCabang = [];
  if(sConfig) {
    const dConf = sConfig.getDataRange().getValues();
    for(let i=1; i<dConf.length; i++) allCabang.push(dConf[i][0]);
  }

  if(!userEmail) return { list: [], role: 'GUEST' };
  
  const d = s.getDataRange().getValues();
  let role = 'USER', allowed = [];
  
  for(let i=1; i<d.length; i++){
    if(String(d[i][0]).toLowerCase() == userEmail.toLowerCase()){
      role = String(d[i][2]).toUpperCase();
      if(d[i][3]) allowed = String(d[i][3]).split(',').map(x=>x.trim());
      break;
    }
  }

  return { list: role === 'ADMIN' ? allCabang : allowed, role: role };
}

// ==========================================
// 2. OPERASIONAL (SEARCH & SAVE)
// ==========================================

function cariBarangDiMaster(keyword, cabang) {
  try {
    const ss = getDbCabang(cabang);
    const s = ss.getSheetByName(SHEET_MASTER);
    if (!s) return { found: false, message: "Tab Master Barang tidak ditemukan di file cabang" };

    const data = s.getRange(2, 1, s.getLastRow()-1, 9).getValues(); // Ambil Col A - I
    let res = [], total = 0;

    for (let i = 0; i < data.length; i++) {
      // Pencarian berdasarkan Kolom A (Kode Part)
      if (String(data[i][0]).toUpperCase() === String(keyword).toUpperCase()) {
        let stok = Number(data[i][8]) || 0; // Col I (Index 8)
        res.push({ lokasi: data[i][5], stockSistem: stok, partNumber: data[i][2], partDpack: data[i][0] });
        total += stok;
      }
    }

    if (res.length > 0) return { found: true, multi: true, items: res, totalStock: total, partDpack: res[0].partDpack, partNumber: res[0].partNumber };
    return { found: false, partDpack: keyword };

  } catch (e) { return { found: false, message: e.message }; }
}

function simpanDataTemuan(data) {
  try {
    const ss = getDbCabang(data.cabang);
    const ts = new Date();
    
    // --- LOGIKA NA (KOLOM GESER KARENA ADA CABANG DI DEPAN) ---
    // Struktur: A=Cabang, B=ID Trx, C=Part Code, D=Qty, E=Waktu
    if (data.status !== 'VALID') {
      const s = ss.getSheetByName(SHEET_LOG_NA);
      const rows = s.getDataRange().getValues();
      let idx = -1;
      
      for(let i=1; i<rows.length; i++) {
        // Cek ID (Col B/Idx 1) dan Code (Col C/Idx 2)
        if(String(rows[i][1]) == data.idTransaksi && String(rows[i][2]) == data.partDpack) {
          idx = i + 1; break;
        }
      }

      if(idx > 0) {
        // Update Qty (Col D/Idx 3) & Waktu (Col E/Idx 4)
        s.getRange(idx, 4).setValue(Number(rows[idx-1][3]) + Number(data.qty)); 
        s.getRange(idx, 5).setValue(ts);
      } else {
        // Insert Baru (Perhatikan urutannya)
        s.appendRow([data.cabang, data.idTransaksi, data.partDpack, Number(data.qty), ts]);
      }
      return { success: true };
    } 
    
    // --- LOGIKA VALID ---
    // Struktur: A=Cabang, B=ID Trx, C=Part Code, D=Qty, E=Name, F=Lokasi, G=Waktu
    else {
      const s = ss.getSheetByName(SHEET_LOG_VALID);
      const rows = s.getDataRange().getValues();
      let idx = -1;

      for(let i=1; i<rows.length; i++) {
        // Cek ID (Idx 1), Code (Idx 2), Lokasi (Idx 5)
        if(String(rows[i][1]) == data.idTransaksi && 
           String(rows[i][2]) == data.partDpack && 
           String(rows[i][5]) == data.lokasiSeharusnya) {
          idx = i + 1; break;
        }
      }

      if(idx > 0) {
        // Update Qty (Col D/Idx 3) & Waktu (Col G/Idx 6)
        s.getRange(idx, 4).setValue(Number(rows[idx-1][3]) + Number(data.qty));
        s.getRange(idx, 7).setValue(ts);
      } else {
        // Insert Baru
        s.appendRow([
          data.cabang,          // A
          data.idTransaksi,     // B
          data.partDpack,       // C
          Number(data.qty),     // D
          data.partNumber,      // E
          data.lokasiSeharusnya,// F
          ts                    // G
        ]);
      }
      return { success: true };
    }
  } catch (e) { return { success: false, message: e.message }; }
}

// ==========================================
// 3. EDIT & HAPUS (INDEX SUDAH DISESUAIKAN)
// ==========================================

function hapusItem(dpack, type, cabang, idTrx) {
  try {
    const s = getDbCabang(cabang).getSheetByName(type==='VALID'?SHEET_LOG_VALID:SHEET_LOG_NA);
    const v = s.getDataRange().getValues();
    // Loop mundur. Cek ID (Idx 1) dan Code (Idx 2)
    for(let k=v.length-1; k>=1; k--) {
      if(String(v[k][1]) == idTrx && String(v[k][2]) == dpack) {
        s.deleteRow(k+1); return {success:true};
      }
    }
    return {success:false};
  } catch(e){return {success:false};}
}

function editItem(dpack, qty, type, cabang, idTrx) {
  try {
    const s = getDbCabang(cabang).getSheetByName(type==='VALID'?SHEET_LOG_VALID:SHEET_LOG_NA);
    const v = s.getDataRange().getValues();
    // Loop Cek ID (Idx 1) dan Code (Idx 2)
    for(let k=1; k<v.length; k++) {
      if(String(v[k][1]) == idTrx && String(v[k][2]) == dpack) {
        s.getRange(k+1, 4).setValue(Number(qty)); // Update Qty (Col D/Idx 3 + 1)
        return {success:true};
      }
    }
    return {success:false};
  } catch(e){return {success:false};}
}

// ==========================================
// 4. REPORTING (INDEX SUDAH DISESUAIKAN)
// ==========================================

function getDashboardStats(cabang) {
  if(!cabang) return { totalQty: 0 };
  try {
    const ss = getDbCabang(cabang);
    const getS = (n) => { const s = ss.getSheetByName(n); return s ? s.getRange(2,1,Math.max(s.getLastRow()-1,1),7).getValues() : []; };
    
    // Qty ada di Kolom D (Index 3) untuk kedua sheet
    const v = getS(SHEET_LOG_VALID).filter(r=>r[1]); // Filter baris kosong berdasarkan ID
    const n = getS(SHEET_LOG_NA).filter(r=>r[1]);

    const sumV = v.reduce((a,b)=>a+(Number(b[3])||0), 0);
    const sumN = n.reduce((a,b)=>a+(Number(b[3])||0), 0);
    
    // Recent Activity mapping
    let recent = [];
    // Valid: Code=Idx 2, Qty=Idx 3, Time=Idx 6
    v.forEach(r => recent.push({dpack:r[2], qty:r[3], time:r[6], type:'VALID'}));
    // NA: Code=Idx 2, Qty=Idx 3, Time=Idx 4
    n.forEach(r => recent.push({dpack:r[2], qty:r[3], time:r[4], type:'NA'}));
    
    recent.sort((a,b) => new Date(b.time) - new Date(a.time));

    return {
      validSKU: v.length, validQty: sumV,
      naSKU: n.length, naQty: sumN,
      totalQty: sumV + sumN,
      recent: recent.slice(0,5)
    };
  } catch(e) { return { totalQty: 0 }; }
}

function getLaporanData(type, cabang) {
  if(!cabang) return [];
  try {
    const ss = getDbCabang(cabang);
    const s = ss.getSheetByName(type==='VALID' ? SHEET_LOG_VALID : SHEET_LOG_NA);
    if(!s || s.getLastRow()<2) return [];
    return s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getDisplayValues();
  } catch(e) { return []; }
}
