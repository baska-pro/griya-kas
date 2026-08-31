/**
 * =========================================================================
 *                   GRIYAKAS - GOOGLE APPS SCRIPT (GAS)
 * =========================================================================
 * Petunjuk Pemasangan Cepat:
 * 1. Buka https://sheets.new di browser Anda untuk membuat Google Sheet baru.
 * 2. Beri nama Sheet Anda, misalnya: "GriyaKas Database".
 * 3. Klik menu: Extensions (Ekstensi) > Apps Script.
 * 4. Hapus seluruh kode bawaan, lalu paste (tempel) SELURUH isi file ini.
 * 5. Klik tombol "Save" (ikon disket / Ctrl+S).
 * 6. Klik tombol biru "Deploy" (Terapkan) di pojok kanan atas > pilih "New deployment" (Penerapan baru).
 * 7. Pilih tipe: "Web app" (Aplikasi web) melalui ikon roda gigi jika belum terpilih.
 * 8. Konfigurasi:
 *    - Description: GriyaKas Sync Webhook
 *    - Execute as: Me (email@gmail.com)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING!
 * 9. Klik "Deploy", lalu jika muncul popup otorisasi, klik "Authorize access" > pilih akun Google Anda > klik "Advanced" > klik "Go to ... (unsafe)" > klik "Allow".
 * 10. Salin "Web app URL" (akhiran /exec) dan tempel ke menu:
 *     Pengaturan > Setup Cloud > Google Spreadsheet di aplikasi GriyaKas!
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // Mencegah race condition saat banyak transaksi ditulis bersamaan
  
  try {
    var contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      return responseJSON({ success: false, message: "Tidak ada data yang dikirim (Payload kosong)" });
    }
    
    var payload = JSON.parse(contents);
    var action = payload.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. TEST KONEKSI
    if (action === 'test') {
      return responseJSON({ 
        success: true, 
        message: "Koneksi ke Google Sheet '" + ss.getName() + "' Berhasil!",
        sheetTitle: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }
    
    // 2. SIMPAN & SINKRONKAN SEMUA DATA
    if (action === 'syncAll') {
      var data = payload.data;
      if (!data) return responseJSON({ success: false, message: "Data kosong" });
      
      // A. Simpan JSON Raw ke Sheet Cadangan (_RAW_BACKUP)
      var rawSheet = getOrCreateSheet(ss, "_RAW_BACKUP");
      rawSheet.clearContents();
      rawSheet.appendRow(["KEY", "DATA_JSON", "TERAKHIR_DIPERBARUI"]);
      rawSheet.appendRow(["GRIYAKAS_DATA", JSON.stringify(data), new Date().toISOString()]);
      
      // Format header raw sheet
      rawSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#E2E8F0");
      
      // B. Tulis Transaksi ke Sheet 'Transaksi'
      if (data.transactions && Array.isArray(data.transactions)) {
        var txSheet = getOrCreateSheet(ss, "Transaksi");
        txSheet.clearContents();
        txSheet.appendRow([
          "ID", 
          "Tanggal", 
          "Tipe", 
          "Kategori", 
          "Akun Sumber", 
          "Akun Tujuan", 
          "Anggota Keluarga", 
          "Nominal (Rp)", 
          "Catatan", 
          "Ada Lampiran"
        ]);
        
        var rows = data.transactions.map(function(t) {
          return [
            t.id,
            t.date,
            t.type,
            t.category,
            t.accountId,
            t.targetAccountId || "-",
            t.person || "Keluarga",
            t.amount,
            t.notes || "",
            t.attachmentImage ? "YA" : "TIDAK"
          ];
        });
        
        if (rows.length > 0) {
          txSheet.getRange(2, 1, rows.length, 10).setValues(rows);
          // Format nominal kolom H sebagai Rupiah/Number
          txSheet.getRange(2, 8, rows.length, 1).setNumberFormat("#,##0");
        }
        
        // Format Header
        txSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#D1FAE5");
      }
      
      // C. Tulis Hutang & Piutang ke Sheet 'Hutang_Piutang'
      if (data.debts && Array.isArray(data.debts)) {
        var debtSheet = getOrCreateSheet(ss, "Hutang_Piutang");
        debtSheet.clearContents();
        debtSheet.appendRow([
          "ID", 
          "Nama Pihak", 
          "Tipe (Hutang/Piutang)", 
          "Total Nominal (Rp)", 
          "Sudah Dibayar (Rp)", 
          "Status Lunas", 
          "Jatuh Tempo", 
          "Catatan"
        ]);
        
        var dRows = data.debts.map(function(d) {
          return [
            d.id, 
            d.personName, 
            d.type === 'HUTANG_SAYA' ? "Hutang Saya (Kewajiban)" : "Piutang Saya (Tagihan)", 
            d.amount, 
            d.paidAmount || 0,
            d.isPaid ? "LUNAS" : "BELUM LUNAS", 
            d.dueDate || "-", 
            d.notes || ""
          ];
        });
        
        if (dRows.length > 0) {
          debtSheet.getRange(2, 1, dRows.length, 8).setValues(dRows);
          debtSheet.getRange(2, 4, dRows.length, 2).setNumberFormat("#,##0");
        }
        debtSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#FEF3C7");
      }
      
      // D. Tulis Target Tabungan ke Sheet 'Tabungan_Impian'
      if (data.goals && Array.isArray(data.goals)) {
        var goalSheet = getOrCreateSheet(ss, "Tabungan_Impian");
        goalSheet.clearContents();
        goalSheet.appendRow([
          "ID", 
          "Nama Target", 
          "Target Nominal (Rp)", 
          "Terkumpul (Rp)", 
          "Progress (%)", 
          "Target Tanggal"
        ]);
        
        var gRows = data.goals.map(function(g) {
          var pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          return [
            g.id,
            g.name,
            g.targetAmount,
            g.currentAmount,
            pct + "%",
            g.targetDate || "-"
          ];
        });
        
        if (gRows.length > 0) {
          goalSheet.getRange(2, 1, gRows.length, 6).setValues(gRows);
          goalSheet.getRange(2, 3, gRows.length, 2).setNumberFormat("#,##0");
        }
        goalSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#DBEAFE");
      }
      
      return responseJSON({ 
        success: true, 
        message: "Data GriyaKas berhasil disinkronkan ke Google Sheet!", 
        timestamp: new Date().toISOString(),
        totalTransactions: data.transactions ? data.transactions.length : 0
      });
    }
    
    // 3. AMBIL DATA CADANGAN UNTUK RESTORE
    if (action === 'fetchAll') {
      var backupSheet = ss.getSheetByName("_RAW_BACKUP");
      if (!backupSheet) {
        return responseJSON({ 
          success: false, 
          message: "Belum ada sheet _RAW_BACKUP di Google Spreadsheet ini." 
        });
      }
      
      var rawJson = backupSheet.getRange(2, 2).getValue();
      if (!rawJson) {
        return responseJSON({ 
          success: false, 
          message: "Data cadangan kosong di Google Spreadsheet." 
        });
      }
      
      var parsedData = JSON.parse(rawJson);
      return responseJSON({ 
        success: true, 
        data: parsedData,
        message: "Data berhasil dipulihkan dari Google Sheet!" 
      });
    }
    
    return responseJSON({ success: false, message: "Aksi tidak dikenali: " + action });
  } catch (err) {
    return responseJSON({ success: false, message: "Terjadi kesalahan di GAS: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return responseJSON({ 
    status: "GriyaKas Google Apps Script Active & Ready", 
    timestamp: new Date().toISOString() 
  });
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function responseJSON(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}
