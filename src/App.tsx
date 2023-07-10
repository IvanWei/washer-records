'use client';

import React, { useEffect } from 'react';
import liff from '@line/liff';

import { BotUI, BotUIAction, BotUIMessageList } from '@botui/react';
import ky from 'ky';
import { createBot } from 'botui';
import '../node_modules/@botui/react/dist/styles/default.theme.scss';

const API_URL: string = import.meta.env.VITE_API_URL;
const RECORDS_PATH: string = import.meta.env.VITE_RECORDS_PATH;
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
let infos = null;

const App = () => {
  if (!liff.isLoggedIn()) {
    console.log('aaa::');
    // liff.login({ redirectUri: "https://blog.ivanwei.co" });
  }

  useEffect(() => {
    myBot.message
      .add({ text: '我是洗衣機記錄 對話機器人' })
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
      .then((data) => {
        switch (data.selected.value) {
          case 1:
            return myBot.message
              .add({ text: '此次使用哪一臺洗衣機？' })
              .then(() => {
                ky.get(`${API_URL}?type=types`)
                  .json()
                  .then(({ data }) => {
                    infos = data;
                    myBot.next();
                  })
                  .catch(() => false);

                return myBot.wait();
              })
              .then(() =>
                myBot.action.set(
                  {
                    options: infos.washers.map((washer) => ({
                      label: washer.label,
                      value: washer.value,
                    })),
                  },
                  { actionType: 'selectButtons' },
                ),
              )
              .then((data) => {
                // setNewLogging((contents) => ({...contents, washer: data.selected.value}));
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
              .then((data) => {
                // setNewLogging((contents) => ({...contents, who: data.selected.value}));
                newLogging.who = data.selected.value;

                return myBot.message.add({ text: '此次洗滌類別是？' });
              })
              .then(() =>
                myBot.action.set(
                  {
                    options: infos.types.map((type) => ({ label: type.label, value: type.value })),
                  },
                  { actionType: 'selectButtons' },
                ),
              )
              .then((data) => {
                // setNewLogging((contents) => ({...contents, type: data.selected.value}));
                newLogging.washingType = data.selected.value;

                if (data.selected.value === 'other') {
                  return myBot.action.set(
                    { type: 'text', placeholder: '輸入內容', required: true },
                    { actionType: 'input' },
                  );
                }

                return myBot.wait({ waitTime: 500 });
              })
              .then((data) => {
                if (typeof data === 'object') {
                  // setNewLogging((contents) => ({...contents, typeMsg: data.value}));
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
              .then((data) => {
                // setNewLogging((contents) => ({...contents, isDirty: data.selected.value}));
                newLogging.isDirty = data.selected.value;
                console.log('newLogging:: ', newLogging);

                ky.post(API_URL, {
                  // method: 'post',
                  headers: { 'Content-Type': 'text/plain' },
                  json: { ...newLogging, type: 'log' },
                })
                  .json()
                  .then(() => {
                    myBot.next();
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
      .then((data) => {
        if (data.selected.value) {
          return location.reload();
        }
        return myBot.message.add({ text: '謝謝使用 😊' });
      })
      .catch(() => false);
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
