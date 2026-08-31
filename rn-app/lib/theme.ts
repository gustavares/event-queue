/**
 * Design tokens as JavaScript values.
 *
 * Most styling goes through NativeWind classes (`text-muted-foreground`), which read the
 * CSS variables in `global.css`. But some React Native props — `placeholderTextColor`,
 * `thumbColor`, `trackColor`, `tintColor` — take a real colour value and cannot use a
 * class. Those read from here.
 *
 * These values MIRROR `global.css`. It is the source of truth; this file and the
 * `NAV_THEME` derived from it must be updated alongside it.
 * Rationale and contrast measurements: docs/design-system.md.
 */

export type ThemeColors = {
  background: string;
  card: string;
  secondary: string;
  popover: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  inkSubtle: string;
  primary: string;
  primaryDeep: string;
  primaryForeground: string;
  success: string;
  destructive: string;
  warning: string;
  statusDraft: string;
  statusActive: string;
  statusFinished: string;
  statusCancelled: string;
};

export const dark: ThemeColors = {
  background: '#1A1A2E',
  card: '#212138',
  secondary: '#2A2A45',
  popover: '#333352',
  border: '#3F3F5C',
  foreground: '#F2F2F7',
  mutedForeground: '#A2A2BE',
  inkSubtle: '#6E6E8A',
  primary: '#16BDD2',
  primaryDeep: '#00838F',
  primaryForeground: '#1A1A2E',
  success: '#31C57D',
  destructive: '#F04444',
  warning: '#F5A623',
  statusDraft: '#A2A2BE',
  statusActive: '#16BDD2',
  statusFinished: '#8080AD',
  statusCancelled: '#C97070',
};

export const light: ThemeColors = {
  background: '#F4F4F8',
  card: '#FFFFFF',
  secondary: '#E6E6EE',
  popover: '#FFFFFF',
  border: '#D2D2DE',
  foreground: '#16162A',
  mutedForeground: '#4A4A66',
  inkSubtle: '#7B7B93',
  primary: '#00838F',
  primaryDeep: '#006670',
  primaryForeground: '#FFFFFF',
  success: '#14804A',
  destructive: '#C42B2B',
  warning: '#B26A08',
  statusDraft: '#4A4A66',
  statusActive: '#00838F',
  statusFinished: '#5C5C8A',
  statusCancelled: '#9E3D3D',
};

/**
 * Theme-independent tokens.
 *
 * The guest ticket is captured as an image and shared into WhatsApp — it has no theme
 * and must not inherit the sender's. The door floods must read identically regardless
 * of the host's colour scheme.
 */
export const fixed = {
  doorOk: '#31C57D',
  doorDeny: '#F04444',
  doorGround: '#101019',
  ticketGround: '#101019',
  ticketInk: '#FFFFFF',
  ticketAccent: '#16BDD2',
  /** QR quiet zone must stay pure white for scanner reliability. */
  ticketQuiet: '#FFFFFF',
} as const;

export const palette = { dark, light };
