export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;
export const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;
export const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === "true";

export const adConfig = {
  enabled: ADSENSE_ENABLED && Boolean(ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID),
  clientId: ADSENSE_CLIENT_ID,
  slotId: ADSENSE_SLOT_ID,
};
