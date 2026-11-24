export interface INFOS_TYPES {
  washers: { label: string; value: string }[];
  types: { label: string; value: string }[];
  whos: { label: string; value: number }[];
}

export interface LIFF_PROFILE {
  userId: string;
  displayName: string;
  pictureUrl?: string | undefined;
  statusMessage?: string | undefined;
}

export interface USER_INFO {
  userId: number;
}
