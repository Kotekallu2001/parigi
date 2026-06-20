# Wassan Field Team App - Google Apps Script Integration Guide

Since you have created **two separate Spreadsheets** and **two Apps Script projects**, copy and paste the respective scripts below into their own Google Sheets!

---

## 📂 SPREADSHEET 1 & SCRIPT 1: Personnel Data System (Attendance/Work Diary)

This spreadsheet manages user accounts, attendance statuses, and daily diaries. This script has been designed using your exact working structure and names (`Users` and `Work_Log` sheets)!

### 1. Sheet Setup Options
Please configure Spreadsheet 1 with these tabs and structures:

* **Sheet Tab 1: `Users`**
  - First Row Headers: `Username` | `Password` | `Role` | `Created Date`

* **Sheet Tab 2: `Work_Log`**
  - First Row Headers: `Date` | `Username` | `Village` | `Activity` | `Work Details` | `Status` | `Reason` | `Timestamp` | `PhotoUrl` | `Location`

---

### 2. Google Apps Script Code (Script 1)
Open Spreadsheet 1 $\rightarrow$ Click **Extensions > Apps Script** $\rightarrow$ Delete everything, paste this code, and deploy as a Web App:

```javascript
/**
 * Wassan Vikarabad Backend API
 */

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. LOGIN API
  if (action === 'login') {
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    const username = e.parameter.username;
    const password = e.parameter.password;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && String(data[i][1]) === password) {
        return contentResponse({ 
          success: true, 
          user: { username: data[i][0], role: data[i][2] } 
        });
      }
    }
    return contentResponse({ success: false, message: "Invalid credentials" });
  }
  
  // 2. GET ATTENDANCE (Filtered by Month/Year)
  if (action === 'getAttendance') {
    const sheet = ss.getSheetByName('Work_Log');
    const data = sheet.getDataRange().getValues();
    const logs = [];
    const targetUser = e.parameter.username;
    const targetMonth = parseInt(e.parameter.month);
    const targetYear = parseInt(e.parameter.year);
    
    for (let i = 1; i < data.length; i++) {
      const dateObj = new Date(data[i][0]);
      if (data[i][1] === targetUser && 
          (dateObj.getMonth() + 1) === targetMonth && 
          dateObj.getFullYear() === targetYear) {
        logs.push({
          date: data[i][0], village: data[i][2], activity: data[i][3],
          workDetails: data[i][4], status: data[i][5], reason: data[i][6]
        });
      }
    }
    return contentResponse({ logs: logs });
  }

  // 3. GET ALL LOGS (For Reports)
  if (action === 'getAllLogs') {
    const sheet = ss.getSheetByName('Work_Log');
    const data = sheet.getDataRange().getValues();
    const logs = [];
    for (let i = 1; i < data.length; i++) {
      logs.push({
        date: data[i][0], username: data[i][1], village: data[i][2], 
        activity: data[i][3], workDetails: data[i][4], status: data[i][5], 
        reason: data[i][6]
      });
    }
    return contentResponse({ logs: logs });
  }

  // 4. GET USERS (Admin Only)
  if (action === 'getUsers') {
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    const users = [];
    for (let i = 1; i < data.length; i++) {
      users.push({ username: data[i][0], role: data[i][2], createdDate: data[i][3] });
    }
    return contentResponse({ users: users });
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;
  
  // 5. SUBMIT WORK LOG
  if (action === 'logWork') {
    const sheet = ss.getSheetByName('Work_Log');
    sheet.appendRow([
      payload.date, 
      payload.username, 
      payload.village || "", 
      payload.activity || "",
      payload.workDetails || "", 
      payload.status, 
      payload.reason || "", 
      new Date(),
      payload.photoUrl || "", 
      payload.location || ""
    ]);
    return contentResponse({ success: true });
  }
  
  // 6. ADD NEW USER
  if (action === 'addUser') {
    const sheet = ss.getSheetByName('Users');
    sheet.appendRow([
      payload.username, 
      payload.password, 
      payload.role, 
      new Date()
    ]);
    return contentResponse({ success: true });
  }
}

function contentResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🖼️ SPREADSHEET 2 & SCRIPT 2: Field Photograph Gallery System (with Google Drive Host)

This spreadsheet registry hosts dynamic field visit photograph uploads linked straight to Google Drive.

### 1. Sheet Tab Setup
In your second spreadsheet, make sure you have a sheet tab named exactly:
- **`Gallery`**
  - Header row 1: `Date` | `Drive Image Link` | `Activity` | `Village` | `Description`

### 2. Google Apps Script Code (Script 2)
Open Spreadsheet 2 $\rightarrow$ Click **Extensions > Apps Script** $\rightarrow$ Delete everything, paste this code:

> **IMPORTANT:** Replace the `'PUT_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'` on line 6 with your specific Drive folder's ID to configure photo folders correctly.

```javascript
// ==========================================
// MOUNT IMAGE GALLERY SCRIPT (SPREADSHEET 2)
// ==========================================
var DRIVE_FOLDER_ID = 'PUT_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'; // Replace with your Drive Folder ID
var GALLERY_SHEET_NAME = 'Gallery';

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'getGallery') {
    return handleGetGallery();
  }
  
  return jsonResponse({ success: false, error: 'Invalid GET action on Gallery Backend.' });
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;
    
    initGallerySheet();

    if (action === 'uploadGallery') {
      return handleUploadGallery(data.items);
    }
    
    return jsonResponse({ success: false, error: 'Invalid POST action on Gallery Backend.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function initGallerySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var gallerySheet = ss.getSheetByName(GALLERY_SHEET_NAME);
  if (!gallerySheet) {
    gallerySheet = ss.insertSheet(GALLERY_SHEET_NAME);
    gallerySheet.appendRow(['Date', 'Drive Image Link', 'Activity', 'Village', 'Description']);
  }
}

function handleGetGallery() {
  try {
    initGallerySheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(GALLERY_SHEET_NAME);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return jsonResponse({ gallery: [] });
    }
    
    var range = sheet.getRange(2, 1, lastRow - 1, 5);
    var values = range.getValues();
    var gallery = [];
    
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var rawDate = row[0];
      var formattedDate = "";
      
      try {
        if (rawDate instanceof Date) {
          formattedDate = rawDate.toISOString().split('T')[0];
        } else if (rawDate) {
          formattedDate = new Date(rawDate).toISOString().split('T')[0];
        }
      } catch (e) {
        formattedDate = String(rawDate);
      }
      
      gallery.push({
        date: formattedDate,
        imageUrl: String(row[1]),
        activity: String(row[2]),
        village: String(row[3]),
        description: String(row[4])
      });
    }
    
    return jsonResponse({ success: true, gallery: gallery });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function handleUploadGallery(items) {
  try {
    initGallerySheet();
    if (!items || !Array.isArray(items)) {
      return jsonResponse({ success: false, error: 'No items provided for gallery upload.' });
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(GALLERY_SHEET_NAME);
    
    var folder;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (err) {
      return jsonResponse({ 
        success: false, 
        error: "Google Drive Folder Access Denied: " + err.toString() 
      });
    }
    
    var uploadCount = 0;
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item.base64) continue;
      
      var fileParts = item.base64.split(',');
      var contentType = 'image/jpeg';
      var base64Data = fileParts[0];
      
      if (fileParts.length > 1) {
        contentType = fileParts[0].split(';')[0].split(':')[1];
        base64Data = fileParts[1];
      }
      
      var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, item.fileName || 'gallery-photo.jpg');
      var file = folder.createFile(decodedBlob);
      
      // Permit view access so users on the web app can load images directly
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      var fileId = file.getId();
      var publicUrl = "https://lh3.googleusercontent.com/d/" + fileId; // Hotlinking path
      
      sheet.appendRow([
        new Date(),
        publicUrl,
        item.activity || '',
        item.village || '',
        item.description || ''
      ]);
      uploadCount++;
    }
    
    return jsonResponse({ success: true, count: uploadCount });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🚀 How to Deploy & Connect Both URLs

1. **Deploy Script 1 (Main Spreadsheet - Personnel Data / 'Users' & 'Work_Log' Tabs):**
   - Click **Deploy > New deployment** in Spreadsheet 1's Apps Script editor.
   - Select type: **Web App**.
   - Execute as: **Me** (Your Google account).
   - Who has access: **Anyone** (Essential for backend access).
   - Click **Deploy**, authorize permissions, and copy the Web App URL.
   - Paste this URL in your application's `GAS_MAIN_WEBAPP_URL` on line 6 of `/services/apiService.ts`.

2. **Deploy Script 2 (Gallery Spreadsheet - 'Gallery' Tab):**
   - Click **Deploy > New deployment** in Spreadsheet 2's Apps Script editor.
   - Select type: **Web App**.
   - Execute as: **Me** (Your Google account).
   - Who has access: **Anyone**.
   - Click **Deploy**, authorize permissions, and copy the Web App URL.
   - Paste this URL in your application's `GAS_GALLERY_WEBAPP_URL` on line 10 of `/services/apiService.ts`.
