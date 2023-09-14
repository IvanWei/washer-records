// eslint-disable-next-line @typescript-eslint/no-unused-vars
const util = {
  getSheetId: function (): string | null {
    return PropertiesService.getScriptProperties().getProperty('sheet_id');
  },
  getLineNotifyInfos: function (): Record<string, string | null> {
    return {
      clientId: PropertiesService.getScriptProperties().getProperty('LINE_CLIENT_ID'),
      clientSecret: PropertiesService.getScriptProperties().getProperty('LINE_CLIENT_SECRET'),
      redirectUri: PropertiesService.getScriptProperties().getProperty('LINE_REDIRECT_URI'),
    };
  },
  // 取得 Target Sheet
  getTargetSheet: function (
    app: GoogleAppsScript.Spreadsheet.Spreadsheet,
    name: string,
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const sheetNames: Record<string, number> = {
      log: 0,
      types: 1,
      dashboard: 2,
      permissions: 3,
    };

    return app.getSheets()[sheetNames[name]];
  },
  // 取特定 Sheet 的所有內容
  getSheetAllData: function (currentSheet: GoogleAppsScript.Spreadsheet.Sheet, type: string) {
    // 略過的行數 (這裡設 1 ，目的是略過第一行標題)
    const skipRow = 1;

    const startRowPos = 1 + skipRow;
    const startColumnPos = 1;
    const rowFieldCount = currentSheet.getLastRow() - skipRow;
    const columnFieldCount = currentSheet.getLastColumn();
    const currentSheetData = currentSheet.getSheetValues(
      startRowPos,
      startColumnPos,
      rowFieldCount,
      columnFieldCount,
    );

    switch (type) {
      case 'log':
      case 'dashboard':
      case 'permissions': {
        const defaultResult: Record<string, string | boolean>[] = [];

        const results = currentSheetData.reduce(function (
          result: Record<string, string | boolean>[],
          data,
        ) {
          switch (type) {
            case 'dashboard':
              result.push({
                washer: data[0] as string,
                thisCount: data[1] as string,
                lastWhoUse: data[2] as string,
                lastTimeUse: data[3] as string,
                lastClearWasher: data[4] as string,
                // lastWhoUse: data[5] as string,
                lastTimeClear: data[6] as string,
                totalCount: data[7] as string,
                triggerNotifyCount: data[8] as string,
                dirtyCount: data[9] as string,
              });
              break;
            case 'permissions':
              result.push({
                status: data[0] as string,
                id: data[1] as string,
                displayName: data[2] as string,
                lastDate: data[3] as string,
                userId: data[4] as string,
                enableLineNotify: !!data[5],
              });
              break;
          }
          return result;
        }, defaultResult);

        return results;
      }
      case 'types': {
        const results: Record<string, { label: string; value: string }[]> = {
          washers: [],
          types: [],
          whos: [],
        };

        currentSheetData.forEach(function (data) {
          if (data[0]) {
            results.washers.push({ label: String(data[0]), value: String(data[1]) });
          }
          if (data[2]) {
            results.types.push({ label: String(data[2]), value: String(data[3]) });
          }
          if (data[4]) {
            results.whos.push({ label: String(data[4]), value: String(data[5]) });
          }
        });

        return results;
      }
    }
  },
  // validatePostActions: function (action) {
  //   return ['create'].indexOf(action) > -1;
  // },
};
