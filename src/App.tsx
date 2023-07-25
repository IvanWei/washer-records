'use client';

import '../node_modules/@botui/react/dist/styles/default.theme.scss';

import React, { useEffect } from 'react';
import liff from '@line/liff';
import ky from 'ky';
import { createBot } from 'botui';
import { BotUI, BotUIAction, BotUIMessageList } from '@botui/react';

import type { KyResponse } from 'ky';

import addRecords from './services/addRecords';
import getUserPermissions from './services/getUserPermissions';

const RECORDS_PATH: string = import.meta.env.VITE_RECORDS_PATH;
const LIFF_REDIRECT_URI: string = import.meta.env.VITE_LIFF_REDIRECT_URI;
const LINE_NOTIFY_CLIENT_ID: string = import.meta.env.VITE_LINE_NOTIFY_CLIENT_ID;
const myBot = createBot();
let userId: number;
let lineNotifyStatus = 'enabled';

const App = () => {
  if (!liff.isLoggedIn()) {
    alert('使用此服務需登入 LINE');
    liff.login({ redirectUri: LIFF_REDIRECT_URI });
  }

  useEffect(() => {
    if (liff.isLoggedIn()) {
      myBot.message
        .add({ text: '我是洗衣機記錄 對話機器人' })
        .then(() => myBot.message.add({ text: '檢查是否有使用權限，請稍後...' }))
        .then(() => getUserPermissions(myBot))
        .then((data: { userId: string; enableLineNotify: boolean }) => {
          userId = data.userId;
          lineNotifyStatus = enableLineNotify ? 'enabled' : 'disabled';

          const urlParams = new URLSearchParams(window.location.search);
          const liffClientId = urlParams.get('liffClientId');
          const lineNotifyCode = urlParams.get('code');
          const lineNotifyState = urlParams.get('state');
          const localLineNotifyState: string = localStorage.getItem('line-notify-state');

          if (
            !liffClientId &&
            lineNotifyCode &&
            lineNotifyState &&
            lineNotifyState === localLineNotifyState
          ) {
            localStorage.removeItem('line-notify-state');

            ky.post<KyResponse>(
              'https://script.google.com/macros/s/AKfycbyaLDA2hEhGAfyIU-67Txb5dKLUTa5nfozvi4iLhXJf/dev',
              {
                headers: { 'Content-Type': 'text/plain' },
                json: { code: lineNotifyCode, userId: data.userId, type: 'line-notify' },
              },
            )
              .json()
              .then(({ data }) => {
                if (data === 'success') {
                  myBot.next();
                }
              })
              .finally(() => {
                location.href = LIFF_REDIRECT_URI;
              });

            return myBot.message
              .add({ text: '系統正處理您的 LINE Notify 設定，請稍後...' })
              .then(() => myBot.wait())
              .then(() =>
                myBot.message.add({ text: ' LINE Notify 設定完成完畢頁面會自動重整，請稍後...' }),
              )
              .then(() => myBot.wait());
          }

          return Promise.resolve();
        })
        .then(() => myBot.message.add({ text: '此次使用哪個服務？' }))
        .then(() =>
          myBot.action.set(
            {
              options: [
                { label: '新增洗滌記錄', value: 1 },
                { label: '查看洗滌記錄', value: 2 },
                { label: '加入通知', value: 3 },
              ].filter((data: { label: string; value: number }) => {
                if (data.value === 3 && lineNotifyStatus === 'enabled') {
                  return false;
                }
                return true;
              }),
            },
            { actionType: 'selectButtons' },
          ),
        )
        .then((data: { selected: { value: number } }) => {
          switch (data.selected.value) {
            case 1:
              return addRecords(myBot, userId);
            case 2:
              window.open(RECORDS_PATH, '_blank');

              return Promise.resolve();

            case 3: {
              const state: string = crypto.randomUUID();

              localStorage.setItem('line-notify-state', state);
              location.href = `https://notify-bot.line.me/oauth/authorize?response_type=code&scope=notify&client_id=${LINE_NOTIFY_CLIENT_ID}&state=${state}&redirect_uri=${LIFF_REDIRECT_URI}`;

              return myBot.wait({ waitTime: 3000 });
            }
          }
        })
        .then(() => myBot.wait({ waitTime: 3000 }))
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
            return myBot.message.add({ text: '謝謝使用 😊' });
          }

          location.reload();
        })
        .catch((e) => {
          alert('意外發生錯誤，頁面將自動重整。');
          console.log(e);
          // location.reload();
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
