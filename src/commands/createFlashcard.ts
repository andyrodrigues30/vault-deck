import { Editor, MarkdownView } from "obsidian";
import FlashcardsPlugin from "../main";
import { ensureFolderExists } from "../utils/ensureFolderExists";
import { createFlashcardTemplate } from "../templates/flashcardTemplate";
import { DecksEventBus } from "decks/DecksEventBus";

export function registerCreateCommands(plugin: FlashcardsPlugin) {
  // create flashcard
  plugin.addCommand({
    id: "create-flashcard",
    name: "Create flashcard",
    callback: () => createFlashcard(plugin)
  });

  // create flashcard with text selection
  plugin.addCommand({
    id: "create-flashcard-selection",
    name: "Create flashcard from selection",
    editorCallback: (editor) =>
      createFlashcardFromSelection(plugin, editor)
  });
}

async function createFlashcard(plugin: FlashcardsPlugin) {
  const deck = plugin.settings.defaultDeck;
  // create file
  const file = await createFlashcardFile(plugin, deck);
  // open file and focus cursor under front heading
  await openFlashcardAndFocus(plugin, file.path);
  // refresh side panel
  DecksEventBus.emit("refresh");
}

async function createFlashcardFromSelection(plugin: FlashcardsPlugin, editor: Editor) {
  const selection = editor.getSelection();
  const deck = plugin.settings.defaultDeck;
  // create file with template
  const content = createFlashcardTemplate(deck, selection);
  const file = await createFlashcardFile(plugin, deck, content);
  // open file and focus cursor under front heading
  await openFlashcardAndFocus(plugin, file.path);
  // refresh side panel
  DecksEventBus.emit("refresh");
}

async function createFlashcardFile(plugin: FlashcardsPlugin, deck: string, contentOverride?: string) {
  const root = plugin.settings.decksRootFolder;
  const deckPath = `${root}/${deck}`;

  await ensureFolderExists(plugin.app, root);
  await ensureFolderExists(plugin.app, deckPath);

  const fileName = `flashcard-${Date.now()}.md`;
  const filePath = `${deckPath}/${fileName}`;

  let content = contentOverride ?? createFlashcardTemplate(deck);

  // ensure front section starts with '## Front'
  const lines = content.split("\n");
  const frontIndex = lines.findIndex(line => line.includes("## Front"));

  if (frontIndex >= 0) {
    if (!lines[frontIndex + 1]) {
      content = lines.join("\n");
    }
  }

  return plugin.app.vault.create(filePath, content);
}

// focus cursor under front heading
async function openFlashcardAndFocus(plugin: FlashcardsPlugin, filePath: string) {
  // open file and focus cursor
  await plugin.app.workspace.openLinkText(filePath, "", true);
  await focusCursor(plugin, "front");
}

export async function focusCursor(plugin: FlashcardsPlugin, side: string) {
  const leaf = plugin.app.workspace.getMostRecentLeaf();
  if (!leaf) return;
  const view = leaf.view;
  if (!(view instanceof MarkdownView)) return;
  const editor: Editor = view.editor;

  // find line with ## Front
  const content = editor.getValue();
  const lines = content.split("\n");

  let cursorLine = 0;
  if (side === "front") {
    cursorLine = lines.findIndex(line => line.includes("## Front"));
  } else {
    cursorLine = lines.findIndex(line => line.includes("## Back"));
  }

  if (cursorLine >= 0) {
    // move cursor to the line below
    editor.setCursor({ line: cursorLine + 1, ch: 0 });
  }
}
