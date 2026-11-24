'use client';

import '../node_modules/@botui/react/dist/styles/default.theme.scss';

import React, { useEffect } from 'react';
import liff from '@line/liff';
import { createBot } from 'botui';
import { BotUI, BotUIAction, BotUIMessageList } from '@botui/react';

import addRecords from './services/addRecords';
import getUserPermissions from './services/getUserPermissions';

const RECORDS_PATH: string = import.meta.env.VITE_RECORDS_PATH;
const LIFF_REDIRECT_URI: string = import.meta.env.VITE_LIFF_REDIRECT_URI;

const myBot = createBot();
let userId: number;

const App = () => {
  if (!liff.isLoggedIn()) {
    alert('使用此服務需登入 LINE');
    liff.login({ redirectUri: LIFF_REDIRECT_URI });
  }

  useEffect(() => {
    if (liff.isLoggedIn()) {
      myBot.message
        .add({ text: '洗衣機記錄對話機器人' })
        .then(() => myBot.message.add({ text: '檢查是否有使用權限，請稍後...' }))
        .then(() => getUserPermissions(myBot))
        .then((data: { userId: number }) => {
          userId = data.userId;

          return Promise.resolve();
        })
        .then(() => myBot.message.add({ text: '此次使用哪個服務？' }))
        .then(() => {
          const options: { label: string; value: number }[] = [
            { label: '新增洗滌記錄', value: 1 },
            { label: '查看洗滌記錄', value: 2 },
          ];

          return myBot.action.set(
            {
              options,
            },
            { actionType: 'selectButtons' },
          );
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error 暫時忽略型別錯誤
        .then((data: { selected: { value: number } }) => {
          switch (data.selected.value) {
            case 1:
              return addRecords(myBot, userId);

            case 2:
              window.open(RECORDS_PATH, '_blank');

              return myBot.wait({ waitTime: 100 });
          }
        })
        .then(() => myBot.message.add({ text: '是否要再新增使用記錄？' }))
        .then(() =>
          myBot.action.set(
            {
              options: [
                { label: '是', value: true },
                { label: '否', value: false },
              ],
            },
            { actionType: 'selectButtons' },
          ),
        )
        .then((data: { selected: { value: boolean } }) => {
          if (!data.selected.value) {
            return myBot.message.add({ text: '📝 資料已儲存，可以安全離開' });
          }

          location.reload();
        })
        .catch((error: unknown) => {
          console.log(error);

          return myBot.message
            .add({ text: '💥 發生預期外錯誤，訊息如下：' })
            .then(() => myBot.message.add({ text: error }));
        });
    }
  }, []);

  return (
    <div>
      <BotUI bot={myBot}>
        <BotUIMessageList />
        <BotUIAction />
      </BotUI>
    </div>
  );
};

export default App;
