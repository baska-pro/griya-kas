/**
 * =========================================================================
 *                   GRIYAKAS - GOOGLE APPS SCRIPT (GAS)
 * =========================================================================
 * Petunjuk Pemasangan Cepat:
 * 1. Buka https://sheets.new dan buat Google Sheet baru.
 * 2. Extensions > Apps Script, lalu tempel SELURUH isi file ini.
 * 3. Deploy > New deployment > Web app.
 * 4. Execute as: Me.
 * 5. Who has access: Anyone.
 * 6. Deploy dan salin URL Web App yang berakhiran /exec.
 *
 * PROTEKSI OPSIONAL (SANGAT DISARANKAN):
 * - Apps Script > Project Settings > Script Properties.
 * - Tambahkan property: GRIYAKAS_ACCESS_KEY
 * - Value: buat kunci acak yang panjang, misalnya 32+ karakter alfanumerik.
 * - Jika property tersebut diisi, gunakan URL di GriyaKas seperti:
 *   https://script.google.com/macros/s/XXXXX/exec?key=KUNCI_ANDA
 * - Jika property tidak diisi, perilaku tetap kompatibel dengan setup lama.
 * - Jangan commit atau membagikan URL Web App beserta access key.
 * =========================================================================
 */

function doPost(e) {
  var contents = e && e.postData ? e.postData.contents : null;
  if (!contents) {
    return responseJSON({ success: false, message: "Tidak ada data yang dikirim (payload kosong)." });
  }

  var payload;
  try {
    payload = JSON.parse(contents);
  } catch (parseErr) {
    return responseJSON({ success: false, message: "Payload JSON tidak valid." });
  }

  if (!isAuthorized(e, payload)) {
    return responseJSON({ success: false, message: "Akses ditolak. Access key tidak valid." });
  }

  var lock = LockService.getScriptLock();
  var locked = lock.tryLock(30000);
  if (!locked) {
    return responseJSON({ success: false, message: "Server sedang sibuk. Coba sinkronkan kembali beberapa saat lagi." });
  }

  try {
    var action = payload.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'test') {
      return responseJSON({
        success: true,
        message: "Koneksi ke Google Sheet '" + ss.getName() + "' berhasil!",
        sheetTitle: ss.getName(),
        protected: isProtectionEnabled(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'syncAll') {
      var data = payload.data;
      if (!data || typeof data !== 'object') {
        return responseJSON({ success: false, message: "Data sinkronisasi kosong atau tidak valid." });
      }

      var rawSheet = getOrCreateSheet(ss, "_RAW_BACKUP");
      rawSheet.clearContents();
      rawSheet.appendRow(["KEY", "DATA_JSON", "TERAKHIR_DIPERBARUI"]);
      rawSheet.appendRow(["GRIYAKAS_DATA", JSON.stringify(data), new Date().toISOString()]);
      rawSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#E2E8F0");

      if (data.transactions && Array.isArray(data.transactions)) {
        var txSheet = getOrCreateSheet(ss, "Transaksi");
        txSheet.clearContents();
        txSheet.appendRow([
          "ID", "Tanggal", "Tipe", "Kategori", "Akun Sumber", "Akun Tujuan",
          "Anggota Keluarga", "Nominal (Rp)", "Catatan", "Ada Lampiran"
        ]);

        var rows = data.transactions.map(function(t) {
          return [
            t.id || "",
            t.date || "",
            t.type || "",
            t.category || "",
            t.accountId || "",
            t.targetAccountId || "-",
            t.person || "Keluarga",
            Number(t.amount) || 0,
            t.notes || "",
            t.attachmentImage ? "YA" : "TIDAK"
          ];
        });

        if (rows.length > 0) {
          txSheet.getRange(2, 1, rows.length, 10).setValues(rows);
          txSheet.getRange(2, 8, rows.length, 1).setNumberFormat("#,##0");
        }
        txSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#D1FAE5");
      }

      if (data.debts && Array.isArray(data.debts)) {
        var debtSheet = getOrCreateSheet(ss, "Hutang_Piutang");
        debtSheet.clearContents();
        debtSheet.appendRow([
          "ID", "Nama Pihak", "Tipe (Hutang/Piutang)", "Total Nominal (Rp)",
          "Sudah Dibayar (Rp)", "Status Lunas", "Jatuh Tempo", "Catatan"
        ]);

        var dRows = data.debts.map(function(d) {
          var debtType = d.type === 'HUTANG_SAYA' || d.type === 'HUTANG'
            ? "Hutang Saya (Kewajiban)"
            : "Piutang Saya (Tagihan)";
          return [
            d.id || "",
            d.personName || d.name || "",
            debtType,
            Number(d.amount) || 0,
            Number(d.paidAmount) || 0,
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

      if (data.goals && Array.isArray(data.goals)) {
        var goalSheet = getOrCreateSheet(ss, "Tabungan_Impian");
        goalSheet.clearContents();
        goalSheet.appendRow([
          "ID", "Nama Target", "Target Nominal (Rp)", "Terkumpul (Rp)",
          "Progress (%)", "Target Tanggal"
        ]);

        var gRows = data.goals.map(function(g) {
          var targetAmount = Number(g.targetAmount) || 0;
          var currentAmount = Number(g.currentAmount) || 0;
          var pct = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;
          return [
            g.id || "",
            g.name || "",
            targetAmount,
            currentAmount,
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

    if (action === 'fetchAll') {
      var backupSheet = ss.getSheetByName("_RAW_BACKUP");
      if (!backupSheet || backupSheet.getLastRow() < 2) {
        return responseJSON({ success: false, message: "Belum ada backup GriyaKas di Spreadsheet ini." });
      }

      var rawJson = backupSheet.getRange(2, 2).getValue();
      if (!rawJson) {
        return responseJSON({ success: false, message: "Data cadangan kosong di Google Spreadsheet." });
      }

      var parsedData;
      try {
        parsedData = JSON.parse(rawJson);
      } catch (backupErr) {
        return responseJSON({ success: false, message: "Data cadangan di Spreadsheet rusak/tidak valid." });
      }

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
    protected: isProtectionEnabled(),
    timestamp: new Date().toISOString()
  });
}

function isProtectionEnabled() {
  return Boolean(PropertiesService.getScriptProperties().getProperty("GRIYAKAS_ACCESS_KEY"));
}

function isAuthorized(e, payload) {
  var expected = PropertiesService.getScriptProperties().getProperty("GRIYAKAS_ACCESS_KEY");
  if (!expected) return true;

  var queryKey = e && e.parameter ? String(e.parameter.key || "") : "";
  var payloadKey = payload && payload.accessKey ? String(payload.accessKey) : "";
  return queryKey === expected || payloadKey === expected;
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function responseJSON(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}
