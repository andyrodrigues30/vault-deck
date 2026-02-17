import VaultDeckPlugin from "../main";
import { DECKS_VIEW_TYPE } from "decks/DecksView";

export function registerDisplayDeckViewCommands(plugin: VaultDeckPlugin) {
  // review all flashcards (all decks)
  plugin.addCommand({
    id: "open-decks-info",
    name: "Open decks info",
    callback: async () => {
      const leaf = plugin.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
            type: DECKS_VIEW_TYPE,
            active: true,
        });
        await plugin.app.workspace.revealLeaf(leaf);
      }
    },
  });

  plugin.addCommand({
    id: "close-decks-info",
    name: "Close decks info",
    callback: async () => {
        plugin.app.workspace.detachLeavesOfType(DECKS_VIEW_TYPE);
    },
  });
}
