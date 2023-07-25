import ky from 'ky';
import { BotuiInterface } from 'botui';

import type { KyResponse } from 'ky';
import type { LIFF_PROFILE } from '../types/index.d';

const API_URL: string = import.meta.env.VITE_API_URL;

export default async (myBot: BotuiInterface) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    const profile: LIFF_PROFILE = await liff.getProfile();
    const {
      data: { isEnabled, enableLineNotify },
    } = await ky
      .get<KyResponse>(
        `${API_URL}?type=permissions&userId=${profile.userId}&displayName=${profile.displayName}`,
      )
      .json();

    if (isEnabled) {
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        myBot.next({ userId: profile.userId, enableLineNotify });
      }, 0);
    } else {
      ky.post<KyResponse>(API_URL, {
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
  } catch (e) {
    alert('#2 權限尚未開通，請與管理者聯繫');
  }

  return myBot.wait();
};
