// plugin settings

export interface VaultDeckSettings {
  decksRootFolder: string;
  defaultDeck: string;
}

export const DEFAULT_SETTINGS: VaultDeckSettings = {
  decksRootFolder: "Decks",
  defaultDeck: "default"
};