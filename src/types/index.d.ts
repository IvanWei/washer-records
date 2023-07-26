export type INFOS_TYPES = {
  washers: { label: string; value: string }[];
  types: { label: string; value: string }[];
  whos: { label: string; value: number }[];
};

export type LIFF_PROFILE = {
  userId: string;
  displayName: string;
  pictureUrl?: string | undefined;
  statusMessage?: string | undefined;
};

export type USER_INFO = { userId: number; isEnabled: boolean; enableLineNotify: boolean };
