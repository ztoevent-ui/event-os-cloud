# Development Notes (Event OS)

## 2025-12-19

### Fix: Spinning Wheel result screen truncates names (e.g. draw 20 only shows ~11)

**File:** `apps/spinning-wheel.html`

**Problem**
- The result overlay rendered winners as large vertical cards centered in a fixed-height container.
- On lower resolutions / when drawing many winners, the bottom items were pushed out of view, making it look like only ~11 names existed.

**Solution**
- Changed `#resultList` layout to a responsive CSS grid so more names fit on screen at once.
- Added `.result-item` variants with auto font sizing based on total winners:
  - `big` (<=3)
  - `mid` (<=12)
  - `small` (>=13)
- Kept `overflow-y: auto` on the list, so all names are always accessible even if they exceed available height.

**Expected result**
- Drawing 20+ winners shows all names in the result overlay (multiple columns), without being visually truncated.
