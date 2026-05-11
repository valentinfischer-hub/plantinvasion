# Handoff: Art-UI → Tech-Code
# Iter30 Bug-Sync — 5 neue UI/UX-Issues

Datum: 2026-05-11 (Run 2)
Von: Art-UI Agent
An: Tech-Code
Priorität: P1 sofort, P2 nach P1

Quelle: QA-Auswertung Iter29 + Iter30 (2026-04-28). Diese Bugs waren bisher nicht in `PI - Art-UI/brain/qa/ui_bugs_from_qa.md` erfasst. Jetzt nachgeführt (B-006 bis B-010).

---

## UI-B-008: I-Hotkey Regression (P1 — sofort)

**Was:** I-Taste im Overworld löst in Iter30-Build keine Reaktion mehr aus. In Iter28 war zumindest ein schwarzes Overlay sichtbar. Regression.

**A11y-Impact:** Keyboard-User komplett ohne Inventory-Zugang → A-006.

**Fix:**
```typescript
// OverworldScene.ts, create()
this.input.keyboard!.on('keydown-I', () => {
  this.scene.pause()
  this.scene.launch('InventoryScene')
})
```
Inventory-Spec: `PI - Art-UI/brain/design/wireframes/inventory_screen.md`

---

## UI-B-009: Q-Hotkey Nebel statt QuestLog (P2)

**Was:** Q-Taste triggert Nebel-Toggle statt QuestLog. Nebel-Label erscheint top-right und überlappt HUD-Area.

**Fix:**
```typescript
// Q → QuestLog
this.input.keyboard!.on('keydown-Q', () => {
  this.scene.launch('QuestLogScene')  // oder 'QuestScene' je nach Key
})
// Nebel-Toggle auf Debug-Only oder anderen Key
```
Nebel-Label: `setDepth` und `setScrollFactor(0)` prüfen damit es nicht über HUD-Elemente ragt.

---

## UI-B-006: Coin-HUD flackert (P2)

**Was:** Coin-Counter friert kurz ein oder flackert bei Coin-Änderung (nach Battle, nach Kauf).

**Fix:**
```typescript
updateCoins(newValue: number) {
  if (this.coinTween) this.coinTween.stop()
  const obj = { val: this.currentCoins }
  this.coinTween = this.tweens.add({
    targets: obj,
    val: newValue,
    duration: 300,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      this.coinsText.setText(`🪙 ${Math.round(obj.val)}`)
    },
    onComplete: () => { this.currentCoins = newValue }
  })
}
```
Bonus: Coin-Roll-Animation ist gleichzeitig ein First-Impression-Punkt (+Feedback-Qualität).

---

## UI-B-007: Kreuzungs-Modal fehlt X-Button (P2)

**Was:** Modal hat nur "Abbruch" unten. Kein X-Button top-right. Verletzt universelle Modal-Convention.

**Fix:**
```typescript
const closeBtn = this.add.text(
  modalX + modalW - 16,
  modalY + 12,
  '✕',
  { fontSize: '14px', color: '#b09070', fontFamily: '"Press Start 2P", monospace' }
)
closeBtn.setInteractive({ useHandCursor: true })
closeBtn.on('pointerover', () => closeBtn.setColor('#f4e8c1'))
closeBtn.on('pointerout', () => closeBtn.setColor('#b09070'))
closeBtn.on('pointerdown', () => this.closeModal())
```

---

## UI-B-010: Intro-Dialog wiederholt nach F5-Reload (P2)

**Was:** Reload während/nach Crossing → Intro-Dialog startet von vorn. Fortschritt seit letztem Auto-Save verloren.

**Fix:** Save-State um `introShown`-Flag erweitern:
```typescript
// SaveState Interface:
introShown: boolean  // NEU, Default: false

// Intro-Trigger in MenuScene oder OverworldScene:
if (!saveState.introShown) {
  this.showIntroDialog()
  saveState.introShown = true
  savegame(saveState)  // sofort speichern nach erstem Trigger
}
```
Synergiert mit B-001 (Save-Failure sichtbar machen) und B-002 (Auto-Save-Debounce).

---

## Quality-Gate

Nach Commits:
1. `tsc --noEmit` grün
2. `vitest run` grün
3. Frischer Tab (kein Cache), alle 5 Bugs manuell nachgetestet
4. I-Taste → Inventory erscheint (kein schwarzes Overlay)
5. Q-Taste → QuestLog erscheint
6. Coins ändern → kein Flackern

**Commit-Prefix:** `fix: iter30 ui-bug-sync (B-006 bis B-010)`
