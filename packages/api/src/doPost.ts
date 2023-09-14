// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doPost(e: GoogleAppsScript.Events.DoPost) {
  const params = (JSON.parse(e.postData.contents) ?? {}) as {
    type?: string;
    userId?: string;
    displayName?: string;
    lineCode?: string;
    washer?: number;
    who?: number;
    washingType?: string;
    washMsg?: string;
    isDirty?: boolean;
    tip?: string;
    helpWho?: string | null;
    notifyHelpWho?: string | null;
    useDate?: string | number | Date;
  };
  const type = params.type ?? '';
  const sheetId = util.getSheetId();

  if (!sheetId) {
    throw new Error('sheetId is null.');
  }

  // 取得 Spreadsheet
  const app = SpreadsheetApp.openById(sheetId);

  // 取得 Target Sheet
  const sheet = util.getTargetSheet(app, type);

  switch (type) {
    case 'log':
      try {
        const now = new Date().toJSON();
        const washer = params.washer ?? '';
        const who = params.who ?? 0;
        const washingType = params.washingType ?? '';
        const washMsg = washingType === 'other' ? params.washMsg : '';
        const isDirty = params.isDirty ?? false;
        const tip = params.tip ?? '';
        const helpWho = params.helpWho ?? null;
        const notifyHelpWho = params.notifyHelpWho ?? null;
        const lastTimeUse = params.useDate ?? now;

        if (
          !!washer &&
          who > 0 &&
          ['clothes', 'sheet', 'mattress protector', 'blanket', 'other'].includes(washingType)
        ) {
          sheet.appendRow([
            lastTimeUse,
            washer,
            who,
            washingType,
            washMsg,
            isDirty,
            tip,
            helpWho,
            notifyHelpWho,
          ]);

          let rangeIndexs = 0;
          const sheetDashboard = util.getTargetSheet(app, 'dashboard');

          sheetDashboard
            .getDataRange()
            .getValues()
            .forEach((data, index) => {
              if (data[0] === washer) {
                rangeIndexs = index;
                return false;
              }
            });

          const ranges = sheetDashboard.getRange(`A${rangeIndexs + 1}:J${rangeIndexs + 1}`);
          const rangeValues = ranges.getValues()[0] as string[];

          const isNewData: boolean =
            new Date(lastTimeUse).getTime() > new Date(rangeValues[3]).getTime();
          const newRangeRowData = {
            washer: rangeValues[0],
            thisCount: parseFloat(rangeValues[1]) + 1,
            lastWhoUse: isNewData ? who : rangeValues[2],
            lastTimeUse: isNewData ? lastTimeUse : rangeValues[3],
            lastNotifyDoClearWasher: rangeValues[4],
            lastWhoDoClearWasher: rangeValues[5],
            lastTimeDoClearWasher: rangeValues[6],
            totalCount: parseFloat(rangeValues[7]) + 1,
            triggerNotifyCount: rangeValues[8],
            dirtyCount: parseFloat(rangeValues[9]) + (isDirty ? 1 : 0),
          };

          ranges.setValues([Object.values(newRangeRowData)]);

          return ContentService.createTextOutput(JSON.stringify({ data: 'success' })).setMimeType(
            ContentService.MimeType.JSON,
          );
        }

        throw new Error('必填欄位沒有資料');
      } catch (error) {
        return ContentService.createTextOutput(
          JSON.stringify({ data: 'failure', message: JSON.stringify(error) }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

    case 'permissions': {
      const userId = params.userId ?? '';
      const displayName = params.displayName ?? '';
      const permissionData = sheet.getDataRange().getValues();
      let rangeIndexs = 0;

      if (!userId || !displayName) {
        return ContentService.createTextOutput(
          JSON.stringify({ data: 'failure', message: '必填欄位沒有資料' }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      permissionData.forEach((data, index) => {
        if (data[1] === userId) {
          rangeIndexs = index;
          return false;
        }
      });

      const ranges = sheet.getRange(`A${rangeIndexs + 1}:D${rangeIndexs + 1}`);
      const rangeValues = ranges.getValues()[0];

      if (rangeValues[0] === 'pending') {
        ranges.setValues([[rangeValues[0], rangeValues[1], rangeValues[2], new Date().toJSON()]]);

        return ContentService.createTextOutput(
          JSON.stringify({ data: 'success', status: 'pending' }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const newRangeRowData = {
        status: 'pending',
        id: userId,
        displayName: displayName,
        lastDate: new Date().toJSON(),
      };

      if (rangeValues[0] === 'success') {
        newRangeRowData.status = 'success';
        ranges.setValues([Object.values(newRangeRowData)]);
      } else {
        sheet.appendRow(Object.values(newRangeRowData));
      }

      return ContentService.createTextOutput(
        JSON.stringify({ data: 'success', status: newRangeRowData.status }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    case 'line-notify': {
      const lineNotifyInfos = util.getLineNotifyInfos();
      const lineCode = params.lineCode ?? '';
      const userId = params.userId ?? '';

      const payload: Record<string, string> = {
        grant_type: 'authorization_code',
        code: lineCode,
        redirect_uri: lineNotifyInfos.redirectUri ?? '',
        client_id: lineNotifyInfos.clientId ?? '',
        client_secret: lineNotifyInfos.clientSecret ?? '',
      };
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/x-www-form-urlencoded',
        payload: JSON.stringify(payload),
      };
      const queryString = Object.keys(payload).reduce((result: string, key: string) => {
        if (result.length > 0) {
          result += '&';
        }

        result += key + '=' + payload[key];
        return result;
      }, '');

      // console.log('queryString:: ', queryString);

      const response = UrlFetchApp.fetch(
        'https://notify-bot.line.me/oauth/token?' + queryString,
        options,
      );
      const result = JSON.parse(response.getContentText()) as {
        status: number;
        access_token: string;
      };
      // Logger.log(response.getContentText());
      // Logger.log(result.access_token);

      let rangeIndexs = 0;
      const sheetPermissions = util.getTargetSheet(app, 'permissions');

      sheetPermissions
        .getDataRange()
        .getValues()
        .forEach((data, index) => {
          if (data[1] === userId) {
            rangeIndexs = index;
            return false;
          }
        });

      const ranges = sheetPermissions.getRange(`A${rangeIndexs + 1}:F${rangeIndexs + 1}`);
      const rangeValues = ranges.getValues()[0] as string[];

      const newRangeRowData = {
        status: rangeValues[0],
        id: rangeValues[1],
        displayName: rangeValues[2],
        lastDate: new Date().toJSON(),
        userId: rangeValues[4],
        lineNotifyToken: result.status === 200 ? result.access_token : null,
      };

      ranges.setValues([Object.values(newRangeRowData)]);

      return ContentService.createTextOutput(JSON.stringify({ data: 'success' })).setMimeType(
        ContentService.MimeType.JSON,
      );
    }
  }
}
