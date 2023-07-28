import ky from 'ky';
import { BotuiInterface } from 'botui';

import type { INFOS_TYPES } from '../types/index.d';

const API_URL: string = import.meta.env.VITE_API_URL;
const RECORDS_PATH: string = import.meta.env.VITE_RECORDS_PATH;

export default (myBot: BotuiInterface, userId: number) => {
  const newLogging = {
    washer: '', // 洗衣機型號
    who: 0, // 使用者
    washingType: '', // 清洗的品項
    typeMsg: '', // 預設清洗品項外的說明
    isDirty: false, // 是否為嚴重髒污
    tip: '', // 備註
    helpWho: 0,
    useDate: '', // 使用時間，補記錄時使用
  };
  const infos: INFOS_TYPES = {
    washers: [],
    types: [],
    whos: [],
  };

  return myBot.message
    .add({ text: '此次使用哪一臺洗衣機？' })
    .then(() => {
      ky.get(`${API_URL}?type=types`)
        .json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          infos.washers = data.washers;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          infos.types = data.types;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          infos.whos = data.whos;
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

      const currentUser = infos.whos.find((who) => who.value === userId);

      if (currentUser) {
        newLogging.who = currentUser.value;

        return myBot.message
          .add({ text: '此次清洗屬於…' })
          .then(() =>
            myBot.action.set(
              {
                options: [
                  { label: '自己的', value: 'person' },
                  { label: '家人的', value: 'family' },
                ],
              },
              { actionType: 'selectButtons' },
            ),
          )
          .then((data: { selected: { value: string } }) => {
            if (data.selected.value === 'family') {
              return myBot.message
                .add({ text: '幫哪位家人清洗？' })
                .then(() =>
                  myBot.action.set(
                    {
                      options: infos.whos
                        .filter((who) => who.value !== currentUser.value)
                        .map((who) => ({ label: who.label, value: who.value })),
                    },
                    { actionType: 'selectButtons' },
                  ),
                )
                .then((data: { selected: { value: number } }) => {
                  newLogging.helpWho = data.selected.value;

                  return myBot.wait({ waitTime: 100 });
                });
            }

            return myBot.message
              .add({ text: '是否請家人幫忙執行清洗？' })
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
                  return myBot.wait({ waitTime: 100 });
                }

                return myBot.message.add({ text: '哪位家人幫忙？' }).then(() =>
                  myBot.action
                    .set(
                      {
                        options: infos.whos
                          .filter((who) => who.value !== currentUser.value)
                          .map((who) => ({ label: who.label, value: who.value })),
                      },
                      { actionType: 'selectButtons' },
                    )
                    .then((data: { selected: { value: number } }) => {
                      newLogging.who = data.selected.value;
                      newLogging.helpWho = currentUser.value;

                      return myBot.wait({ waitTime: 100 });
                    }),
                );
              });
          });
      }

      throw new Error('沒有使用權限，請和服務管理者聯繫');
    })
    .then(() => myBot.message.add({ text: '此次洗滌類別是？' }))
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

      return myBot.message.add({ text: '此次是否屬於事後補登記？' });
    })
    .then(() => {
      return myBot.action
        .set(
          {
            options: [
              { label: '是', value: true },
              { label: '否', value: false },
            ],
          },
          { actionType: 'selectButtons' },
        )
        .then((data: { selected: { value: boolean } }) => {
          if (!data.selected.value) {
            return myBot.wait({ waitTime: 100 });
          }

          const now = new Date();
          const thisDefaultValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
            2,
            '0',
          )}-${String(now.getDate()).padStart(
            2,
            '0',
          )} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

          return myBot.action.set(
            {
              type: 'datetime-local',
              placeholder: '輸入內容',
              required: true,
              defaultValue: thisDefaultValue,
              max: thisDefaultValue,
            },
            { actionType: 'input' },
          );
        });
    })
    .then((data: { text: string; value: string }) => {
      newLogging.useDate = data ? new Date(data.value).toJSON() : '';

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
};
