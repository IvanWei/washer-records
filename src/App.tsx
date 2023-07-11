'use client';

import React, { useEffect } from 'react';
import liff from '@line/liff';

import { BotUI, BotUIAction, BotUIMessageList } from '@botui/react';
import ky from 'ky';
import { createBot } from 'botui';
import '../node_modules/@botui/react/dist/styles/default.theme.scss';

interface INFOS_TYPES {
  washers: { label: string; value: string }[];
  types: { label: string; value: string }[];
  who: { label: string; value: string }[];
}

const API_URL: string = import.meta.env.VITE_API_URL as string;
const RECORDS_PATH: string = import.meta.env.VITE_RECORDS_PATH as string;
const LIFF_REDIRECT_URI: string = import.meta.env.VITE_LIFF_REDIRECT_URI as string;
const myBot = createBot();
const DEFAULT_LOGGING = {
  washer: '',
  who: 0,
  washingType: '',
  typeMsg: '',
  isDirty: false,
  tip: '',
};
const newLogging = { ...DEFAULT_LOGGING };
let infos: INFOS_TYPES;

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
        .then(async () => {
          try {
            const profile = await liff.getProfile();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: isEnabled }: any = await ky
              .get(
                `${API_URL}?type=permissions&userId=${profile.userId}&displayName=${profile.displayName}`,
              )
              .json();

            if (isEnabled) {
              myBot.next();
            } else {
              ky.post(API_URL, {
                headers: { 'Content-Type': 'text/plain' },
                json: {
                  userId: profile.userId,
                  displayName: profile.displayName,
                  type: 'permissions',
                },
              })
                .json()
                .then(() => {
                  alert('#1 權限尚未開通，請與管理者聯繫');
                })
                .catch((e) => {
                  throw e;
                });
            }

            return myBot.wait();
          } catch (e) {
            alert('#2 權限尚未開通，請與管理者聯繫');
          }
        })
        .then(() => myBot.message.add({ text: '此次使用哪個服務？' }))
        .then(() =>
          myBot.action.set(
            {
              options: [
                { label: '新增洗滌記錄', value: 1 },
                { label: '查看洗滌記錄', value: 2 },
                { label: '加入通知', value: 3 },
              ],
            },
            { actionType: 'selectButtons' },
          ),
        )
        .then((data: { selected: { value: number } }) => {
          switch (data.selected.value) {
            case 1:
              return myBot.message
                .add({ text: '此次使用哪一臺洗衣機？' })
                .then(() => {
                  ky.get(`${API_URL}?type=types`)
                    .json()
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .then(({ data }: any) => {
                      infos = data as INFOS_TYPES;
                      myBot.next();
                    })
                    .catch(() => false);

                  return myBot.wait();
                })
                .then(() =>
                  myBot.action.set(
                    {
                      options: infos.washers.map((washer): { label: string; value: string } => ({
                        label: washer.label,
                        value: washer.value,
                      })),
                    },
                    { actionType: 'selectButtons' },
                  ),
                )
                .then((data: { selected: { value: string } }) => {
                  newLogging.washer = data.selected.value;

                  return myBot.message.add({ text: '此次使用者是？' });
                })
                .then(() =>
                  myBot.action.set(
                    {
                      options: infos.who.map((who) => ({ label: who.label, value: who.value })),
                    },
                    { actionType: 'selectButtons' },
                  ),
                )
                .then((data: { selected: { value: number } }) => {
                  newLogging.who = data.selected.value;

                  return myBot.message.add({ text: '此次洗滌類別是？' });
                })
                .then(() =>
                  myBot.action.set(
                    {
                      options: infos.types.map((type) => ({
                        label: type.label,
                        value: type.value,
                      })),
                    },
                    { actionType: 'selectButtons' },
                  ),
                )
                .then((data: { selected: { value: string } }) => {
                  newLogging.washingType = data.selected.value;

                  if (data.selected.value === 'other') {
                    return myBot.action.set(
                      { type: 'text', placeholder: '輸入內容', required: true },
                      { actionType: 'input' },
                    );
                  }

                  return myBot.wait({ waitTime: 500 });
                })
                .then((data: { value: string }) => {
                  if (typeof data === 'object') {
                    newLogging.typeMsg = data.value;
                  }

                  return myBot.message.add({ text: '此次屬於嚴重髒污？' });
                })
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
                  newLogging.isDirty = data.selected.value;

                  ky.post(API_URL, {
                    headers: { 'Content-Type': 'text/plain' },
                    json: { ...newLogging, type: 'log' },
                  })
                    .json()
                    .then(() => {
                      myBot.next();
                    })
                    .catch((e) => {
                      throw e;
                    });

                  return myBot.wait();
                })
                .then(() => myBot.message.add({ text: '記錄已存入 Google sheet' }))
                .then(() => {
                  console.log('newLoggingaa:: ', JSON.stringify(newLogging));

                  return myBot.message.add(
                    {
                      links: [
                        {
                          text: '點擊我可以查看記錄',
                          href: RECORDS_PATH,
                          target: '_blank',
                        },
                      ],
                    },
                    { messageType: 'links' },
                  );
                });
            case 2:
              return myBot.message.add(
                {
                  links: [
                    {
                      text: '點擊我可以查看記錄',
                      href: RECORDS_PATH,
                      target: '_blank',
                    },
                  ],
                },
                { messageType: 'links' },
              );
            case 3:
              return myBot.message.add({ text: '尚未開放' });
            // return myBot.message.add(
            //   {
            //     links: [
            //       {
            //         text: '點擊我',
            //         href: '',
            //         target: '_blank',
            //       },
            //     ],
            //   },
            //   { messageType: 'links' },
            // );
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
        .catch(() => {
          alert('bbb::');
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
