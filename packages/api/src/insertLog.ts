// eslint-disable-next-line @typescript-eslint/no-unused-vars
function insertLog(type: string, info: { fileName: string; lineNumber: number } | string) {
  const spreadsheetName = 'SYSTEM LOGGING';

  let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  let sheet: GoogleAppsScript.Spreadsheet.Sheet | undefined;
  let errorMessage = '';

  if (type === 'info') {
    return;
  } else if (type === 'error') {
    if (typeof info === 'string') {
      errorMessage = info;
    } else {
      const fileName = info.fileName;
      const lineNumber = info.lineNumber;

      errorMessage = '[' + fileName + '.js (Line: ' + lineNumber + ')] ' + JSON.stringify(info);
    }
  }

  try {
    const fileId = PropertiesService.getScriptProperties().getProperty(spreadsheetName);

    if (fileId) {
      spreadsheet = SpreadsheetApp.openById(fileId);
    } else {
      const file = DriveApp.searchFiles(
        'title = "' + spreadsheetName + '" and mimeType = "' + MimeType.GOOGLE_SHEETS + '"',
      );

      spreadsheet = file.hasNext()
        ? SpreadsheetApp.open(file.next())
        : SpreadsheetApp.create(spreadsheetName);

      const fileId = spreadsheet.getId();
      PropertiesService.getScriptProperties().setProperty(spreadsheetName, fileId);
    }

    sheet = spreadsheet.getSheets()[0];

    const now = new Date().toString();

    Logger.log('Log ' + type + ': ' + errorMessage);
    sheet.appendRow([now, type, errorMessage]);
  } catch (error) {
    let fileName = '';
    let lineNumber = 0;

    if (typeof info === 'object') {
      fileName = info.fileName;
      lineNumber = info.lineNumber;
    }

    if (error instanceof Error) {
      errorMessage = '[' + fileName + '.js (Line: ' + lineNumber + ')] ' + error.message;
    } else {
      errorMessage = '[' + fileName + '.js (Line: ' + lineNumber + ')] ' + JSON.stringify(error);
    }

    Logger.log(errorMessage);

    if (sheet) {
      sheet.appendRow([new Date().toString(), 'error', errorMessage]);
      return;
    }

    const file = DriveApp.searchFiles(
      'title = "' + spreadsheetName + '" and mimeType = "' + MimeType.GOOGLE_SHEETS + '"',
    );
    spreadsheet = file.hasNext()
      ? SpreadsheetApp.open(file.next())
      : SpreadsheetApp.create(spreadsheetName);

    const fileId = spreadsheet.getId();
    PropertiesService.getScriptProperties().setProperty(spreadsheetName, fileId);

    sheet = spreadsheet.getSheets()[0];
  }
}
