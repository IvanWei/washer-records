// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doGet(e: GoogleAppsScript.Events.DoGet) {
  const params = e.parameter;
  const type: string = params.type || '';
  const sheetId: string = util.getSheetId() ?? '';

  // 取得 Spreadsheet
  const app = SpreadsheetApp.openById(sheetId);

  // 取得 Target Sheet
  const sheet = util.getTargetSheet(app, type);

  switch (type) {
    case 'types': {
      const sheetData = util.getSheetAllData(sheet, type);

      return ContentService.createTextOutput(JSON.stringify({ data: sheetData })).setMimeType(
        ContentService.MimeType.JSON,
      );
    }

    case 'permissions': {
      const data: { userId: string; isEnabled: boolean; enableLineNotify: boolean } = {
        userId: '',
        isEnabled: false,
        enableLineNotify: false,
      };

      try {
        const sheetData = util.getSheetAllData(sheet, type) as Record<string, string | boolean>[];
        const userId = params.userId || '';
        const targetUserData: Record<string, string | boolean> | undefined = sheetData.find(
          (user) => user.id === userId && user.status === 'success',
        );

        if (!targetUserData) {
          throw new Error('User is not find.');
        }

        data.userId = targetUserData.userId as string;
        data.isEnabled = !!targetUserData;
        data.enableLineNotify = targetUserData.enableLineNotify as boolean;
      } catch (e) {
        data.isEnabled = false;
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          data,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
}
