import ky from 'ky';
import { BotuiInterface } from 'botui';
import liff from '@line/liff';

import type { LIFF_PROFILE } from '../types/index.d';

const API_URL: string = import.meta.env.VITE_API_URL;

export default async (myBot: BotuiInterface) => {
  try {
    const profile: LIFF_PROFILE = await liff.getProfile();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await ky
      .get(`${API_URL}?type=permissions&userId=${profile.userId}`)
      .json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((result: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!result.data) {
          alert('#1 權限尚未開通，請與管理者聯繫');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return result.data;
      })
      .catch((e: unknown) => {
        throw e;
      });
  } catch (e) {
    alert(`#2 權限尚未開通，請與管理者聯繫 ${String(e)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return myBot.wait();
};
