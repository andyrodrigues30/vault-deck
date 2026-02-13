export function createFlashcardTemplate(
  deck: string,
  backContent: string = ""
): string {
  const today = new Date().toISOString();

  return `---
type: flashcard
deck: ${deck}
lastReviewed: ${today}
due: ${today}
interval: 1
---

## Front


---

## Back
${backContent}`;

}
