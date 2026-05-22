export const ACCESS_STORAGE_KEY = 'siteUnlocked';

export const COUPLE_PINS = {
  pablo: '2520',
  ana: '2002',
};

export const isValidPin = (pin) => Object.values(COUPLE_PINS).includes(pin.trim());
