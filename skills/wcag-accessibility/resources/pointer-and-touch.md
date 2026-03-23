# Pointer, Touch, and Gestures

WCAG Success Criteria: 2.5.1 (Pointer Gestures), 2.5.2 (Pointer Cancellation), 2.5.4 (Motion Actuation), 2.5.7 (Dragging Movements) [NEW 2.2], 2.5.8 (Target Size Minimum) [NEW 2.2]

## Pointer Gestures (2.5.1)

Any functionality using multipoint or path-based gestures must have a single-pointer alternative:

```tsx
// Multipoint gesture: pinch-to-zoom on an image
// Must also provide: zoom buttons
<div className="relative">
  <img src="/car.jpg" alt="Vehicle photo" />
  <div className="absolute bottom-2 right-2 flex gap-1">
    <button onClick={zoomIn} aria-label="Zoom in">
      <Plus className="size-4" />
    </button>
    <button onClick={zoomOut} aria-label="Zoom out">
      <Minus className="size-4" />
    </button>
  </div>
</div>

// Path-based gesture: swipe to navigate carousel
// Must also provide: previous/next buttons
<div>
  <div>{slides[current]}</div>
  <button onClick={prev} aria-label="Previous slide">Previous</button>
  <button onClick={next} aria-label="Next slide">Next</button>
</div>

// Path-based gesture: draw a selection area on a map
// Must also provide: input fields for coordinates or address search
```

### Common Multipoint/Path Gestures Needing Alternatives

| Gesture | Alternative |
|---------|-------------|
| Pinch to zoom | Zoom +/- buttons |
| Swipe to navigate | Previous/Next buttons |
| Swipe to dismiss/delete | Dismiss/Delete button |
| Two-finger scroll (horizontal) | Scroll buttons or arrows |
| Draw/trace a path | Tap waypoints, or input fields |
| Rotate (two-finger twist) | Rotation control or input |

## Pointer Cancellation (2.5.2)

Activation must happen on the **up-event** (mouseup/pointerup/touchend), and users must be able to abort:

```tsx
// PASS — native <button> and <a> activate on click (up-event) by default
<button onClick={handleDelete}>Delete</button>

// FAIL — activating on mousedown/pointerdown (no chance to abort)
<div onMouseDown={handleDelete}>Delete</div>

// FAIL — activating on touchstart
<div onTouchStart={handleNavigate}>Go to page</div>

// PASS — if using down-event, allow abort by moving pointer away
<button
  onPointerDown={() => setPressed(true)}
  onPointerUp={() => {
    if (pressed) handleAction()
    setPressed(false)
  }}
  onPointerLeave={() => setPressed(false)}  // Abort if pointer leaves
>
  Action
</button>

// EXCEPTION — up-event is essential to the function
// Drawing, drag operations, playing a piano key — down-event is acceptable
```

### Rules

1. **Prefer click events** (they fire on pointer-up by default)
2. If using pointer-down: allow abort by moving pointer away before releasing
3. If activation happens on down-event: provide an undo mechanism
4. Exception: real-time interactions where down-event is essential (instruments, drawing)

## Motion Actuation (2.5.4)

Functionality triggered by device motion must have a UI alternative and be disableable:

```tsx
// Shake to undo — must also provide an undo button
<button onClick={handleUndo} aria-label="Undo">
  <Undo className="size-4" />
</button>

// Tilt to scroll — must also provide scroll controls
<button onClick={scrollUp} aria-label="Scroll up">Up</button>
<button onClick={scrollDown} aria-label="Scroll down">Down</button>

// Device motion must be disableable
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={motionEnabled}
    onChange={(e) => setMotionEnabled(e.target.checked)}
  />
  Enable shake gestures
</label>
```

### Why

- Users with motor disabilities may have involuntary movements
- Devices may be mounted (wheelchair, stand) and can't be shaken/tilted
- Some users with vestibular disorders are affected by motion

## Dragging Movements (2.5.7) [NEW in WCAG 2.2]

Any functionality that uses dragging must have a single-pointer alternative that doesn't require dragging:

```tsx
// FAIL — sortable list with drag only
<SortableList onDragEnd={handleReorder}>
  {items.map(item => <SortableItem key={item.id}>{item.name}</SortableItem>)}
</SortableList>

// PASS — drag AND buttons for reordering
<ul>
  {items.map((item, index) => (
    <li key={item.id} className="flex items-center gap-2">
      <GripVertical className="cursor-grab" aria-hidden="true" />
      <span>{item.name}</span>
      <button
        onClick={() => moveUp(index)}
        disabled={index === 0}
        aria-label={`Move ${item.name} up`}
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        onClick={() => moveDown(index)}
        disabled={index === items.length - 1}
        aria-label={`Move ${item.name} down`}
      >
        <ChevronDown className="size-4" />
      </button>
    </li>
  ))}
</ul>

// Slider — drag AND text input
<div className="flex items-center gap-3">
  <input
    type="range"
    min={0}
    max={100}
    value={price}
    onChange={(e) => setPrice(Number(e.target.value))}
    aria-label="Maximum price"
  />
  <input
    type="number"
    min={0}
    max={100}
    value={price}
    onChange={(e) => setPrice(Number(e.target.value))}
    className="w-20"
    aria-label="Maximum price (exact value)"
  />
</div>

// Map — drag to pan AND arrow buttons or search
<div>
  <Map draggable />
  <div className="flex gap-1">
    <button onClick={() => panMap('up')} aria-label="Pan map up">↑</button>
    <button onClick={() => panMap('down')} aria-label="Pan map down">↓</button>
    <button onClick={() => panMap('left')} aria-label="Pan map left">←</button>
    <button onClick={() => panMap('right')} aria-label="Pan map right">→</button>
  </div>
</div>

// File upload — drag-and-drop AND file picker button
<div>
  <div
    onDrop={handleDrop}
    onDragOver={(e) => e.preventDefault()}
    className="border-2 border-dashed p-8 text-center"
  >
    Drag files here
  </div>
  <button onClick={() => fileInputRef.current?.click()}>
    Choose files
  </button>
  <input ref={fileInputRef} type="file" className="sr-only" onChange={handleFileSelect} />
</div>
```

### Common Drag Operations Needing Alternatives

| Drag Operation | Single-Pointer Alternative |
|----------------|---------------------------|
| Reorder list items | Up/Down buttons |
| Move kanban cards | Dropdown to select column |
| Resize panels | Input field for size or resize buttons |
| Drag slider thumb | Input field, +/- buttons, or tap on track |
| Pan map | Arrow buttons, address search |
| Drag-and-drop files | File picker button |
| Color picker (area drag) | Hex/RGB input fields |
| Crop image | Input fields for crop dimensions |

## Target Size (2.5.8) [NEW in WCAG 2.2]

Interactive targets must be at least **24x24 CSS pixels**, with 44x44 recommended for touch:

```tsx
// PASS — adequate size (44x44)
<button className="min-h-11 min-w-11 px-4 py-2">
  Submit
</button>

// PASS — icon button with padding (24x24 minimum met)
<button className="p-3" aria-label="Close">
  <X className="size-4" />    {/* 16px icon + 12px padding each side = 40px target */}
</button>

// FAIL — tiny icon button
<button className="p-0" aria-label="Close">
  <X className="size-4" />    {/* Only 16x16 target */}
</button>

// PASS — small target but adequate spacing (spacing exception)
<nav className="flex gap-4">
  {/* 20x20 targets but 16px gap provides enough surrounding space */}
  <a href="/" className="p-0.5">Home</a>
  <a href="/about" className="p-0.5">About</a>
</nav>
```

### Size Requirements

| Target Type | Minimum Size | Recommended |
|-------------|-------------|-------------|
| Buttons, links (general) | 24x24 CSS px | 44x44 CSS px |
| Mobile touch targets | 24x24 CSS px | 48x48 CSS px |
| Inline text links | Exempt | N/A |
| Sentence-end links | Exempt | N/A |
| User-agent controlled | Exempt | N/A |

### Spacing Exception

A target smaller than 24x24 CSS pixels is acceptable if the **undersized target offset** creates enough space. Specifically, the target plus its surrounding spacing must create an area where no other target is within 24px.

```tsx
// These small links pass because of adequate spacing
<div className="flex gap-6 text-sm">
  <a href="/privacy">Privacy</a>    {/* Small text target, but 24px+ gap */}
  <a href="/terms">Terms</a>
</div>

// These fail — too close together with small targets
<div className="flex gap-1 text-xs">
  <a href="/a">A</a>
  <a href="/b">B</a>    {/* Tiny targets packed together */}
  <a href="/c">C</a>
</div>
```

### Inline Text Links Exception

Links within a sentence or paragraph of text are exempt from the 24x24 minimum:

```tsx
// EXEMPT — inline links within running text
<p>
  Read our <a href="/terms">terms of service</a> and
  <a href="/privacy">privacy policy</a> for more details.
</p>
```
