# Timing, Audio Control, and Authentication

WCAG Success Criteria: 1.4.2 (Audio Control), 2.1.4 (Character Key Shortcuts), 2.2.1 (Timing Adjustable), 3.3.4 (Error Prevention), 3.3.7 (Redundant Entry) [NEW 2.2], 3.3.8 (Accessible Authentication) [NEW 2.2]

## Audio Control (1.4.2)

Audio that auto-plays for more than 3 seconds must have a mechanism to pause, stop, or control volume independently of system volume:

```tsx
// PASS — auto-playing audio with controls
<div>
  <video autoPlay muted playsInline>
    <source src="/hero-video.mp4" type="video/mp4" />
  </video>
  <button onClick={toggleMute} aria-label={isMuted ? "Unmute video" : "Mute video"}>
    {isMuted ? <VolumeX /> : <Volume2 />}
  </button>
</div>

// PASS — auto-play with muted default (user must opt-in to audio)
<video autoPlay muted loop playsInline>
  <source src="/bg-video.mp4" type="video/mp4" />
</video>

// FAIL — auto-playing audio with no controls
<audio autoPlay src="/background-music.mp3" />

// PASS — audio with controls visible
<audio controls src="/podcast.mp3" />
```

### Rules

- Best practice: **never auto-play audio** — let users opt in
- If auto-playing: start **muted** with visible unmute control
- Audio controls must be **near the top of the page** (users need to find them quickly)
- Controls must be keyboard accessible
- Volume control must be independent of system volume

## Character Key Shortcuts (2.1.4)

If the app uses single-character keyboard shortcuts (letters, numbers, punctuation), users must be able to:

```tsx
// Option 1: Turn them off
// Option 2: Remap them to include a modifier key (Ctrl/Alt/Cmd)
// Option 3: Only active when the relevant component has focus

// FAIL — global single-key shortcut with no way to disable
document.addEventListener('keydown', (e) => {
  if (e.key === 's') search()      // 's' alone triggers search everywhere
  if (e.key === 'n') newListing()  // 'n' alone triggers new listing
})

// PASS — shortcuts use modifier keys
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') search()     // Ctrl+S
  if (e.ctrlKey && e.key === 'n') newListing() // Ctrl+N
})

// PASS — shortcut only active when component has focus
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'ArrowLeft') previousSlide()
    if (e.key === 'ArrowRight') nextSlide()
  }}
>
  <Carousel />
</div>

// PASS — shortcuts can be disabled in settings
function useKeyboardShortcuts() {
  const { shortcutsEnabled } = useSettings()

  useEffect(() => {
    if (!shortcutsEnabled) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTyping()) {
        e.preventDefault()
        focusSearch()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcutsEnabled])
}
```

### Why

- Speech recognition software converts spoken words to keystrokes
- Saying "search" might type "s-e-a-r-c-h", triggering 6 different shortcuts
- Users with motor disabilities may accidentally press keys

## Timing Adjustable (2.2.1)

Time limits must be adjustable by the user:

```tsx
// Session timeout — warn and allow extension
function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Show warning 2 minutes before timeout
    const warningTimer = setTimeout(() => {
      setShowWarning(true)
      setTimeLeft(120)
    }, SESSION_DURATION - 120_000)

    return () => clearTimeout(warningTimer)
  }, [])

  const extendSession = async () => {
    await refreshSession()
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div role="alertdialog" aria-label="Session timeout warning">
      <p>Your session will expire in {timeLeft} seconds.</p>
      <button onClick={extendSession}>Extend session</button>
      <button onClick={logout}>Log out</button>
    </div>
  )
}

// Auto-updating content (news feed, dashboard) — provide pause
<div>
  <div className="flex items-center justify-between">
    <h2>Live Updates</h2>
    <button onClick={() => setPaused(!paused)}>
      {paused ? 'Resume updates' : 'Pause updates'}
    </button>
  </div>
  <div aria-live={paused ? 'off' : 'polite'}>
    {updates.map(update => <Update key={update.id} {...update} />)}
  </div>
</div>
```

### Rules

Users must be able to do at least one of:
1. **Turn off** the time limit before encountering it
2. **Adjust** the time limit (at least 10x the default)
3. **Extend** the time limit (warned at least 20 seconds before, simple action to extend, allowed to extend at least 10 times)

### Exceptions

- **Real-time events** (auctions, live events) — time is essential
- **20-hour limit** — time limits over 20 hours are exempt
- **Security** — re-authentication timeouts (but must preserve data and restore session)

## Error Prevention — Legal, Financial, Data (3.3.4)

For pages that cause legal commitments, financial transactions, or data modifications:

```tsx
// Reversible — allow undo
<div role="status" aria-live="polite">
  <p>Listing deleted.</p>
  <button onClick={undoDelete}>Undo</button>
</div>

// Checked — review before submit
function CheckoutConfirmation({ order }) {
  return (
    <div>
      <h2>Review Your Order</h2>
      <dl>
        <dt>Vehicle</dt>
        <dd>{order.vehicle}</dd>
        <dt>Total</dt>
        <dd>{formatCurrency(order.total)}</dd>
      </dl>
      <button onClick={() => setStep('edit')}>Edit order</button>
      <button onClick={submitOrder}>Confirm and pay</button>
    </div>
  )
}

// Confirmed — require explicit confirmation for destructive actions
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your
        account and remove all your listings.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={deleteAccount}>
        Yes, delete my account
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Requirements

At least one of:
1. **Reversible** — submission can be undone
2. **Checked** — data is validated and user can correct errors
3. **Confirmed** — user can review and confirm before final submission

## Redundant Entry (3.3.7) [NEW in WCAG 2.2]

Don't make users re-enter information they've already provided in the same process:

```tsx
// FAIL — asking for shipping address again for billing
// Step 1: Enter shipping address
// Step 2: Enter billing address (same fields, no auto-fill from step 1)

// PASS — offer to copy from previous step
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={sameAsShipping}
    onChange={(e) => {
      setSameAsShipping(e.target.checked)
      if (e.target.checked) setBillingAddress(shippingAddress)
    }}
  />
  Billing address is the same as shipping address
</label>

// PASS — auto-populate from earlier in the process
<input
  type="email"
  value={email}              // Pre-filled from account creation step
  onChange={handleChange}
  aria-label="Email address"
/>

// PASS — allow selection from previously entered data
<select aria-label="Select address">
  <option value="">Enter new address</option>
  {savedAddresses.map(addr => (
    <option key={addr.id} value={addr.id}>{addr.label}</option>
  ))}
</select>
```

### Rules

- If information was entered in a previous step, auto-populate it
- If the same information is needed again, offer to reuse it (checkbox, dropdown)
- Users can still modify auto-populated values
- Exceptions: re-entering for security (password confirmation), information has changed

## Accessible Authentication (3.3.8) [NEW in WCAG 2.2]

Authentication must not rely on cognitive function tests:

```tsx
// PASS — standard password field (allows paste + password managers)
<input
  type="password"
  autoComplete="current-password"    // Enables password manager autofill
  // Do NOT set: onPaste={(e) => e.preventDefault()}  ← this FAILS 3.3.8
/>

// PASS — magic link / email code
<p>We sent a code to your email. Enter it below:</p>
<input
  type="text"
  autoComplete="one-time-code"     // Enables SMS/email code autofill
  inputMode="numeric"
  pattern="[0-9]*"
/>

// PASS — OAuth / SSO (no cognitive test)
<button onClick={() => signIn('google')}>Sign in with Google</button>

// PASS — passkey / biometric
<button onClick={authenticateWithPasskey}>Sign in with passkey</button>

// FAIL — CAPTCHA with no accessible alternative
<img src="/captcha.png" alt="Type the characters you see" />
<input type="text" />

// PASS — CAPTCHA with accessible alternative
<div>
  <img src="/captcha.png" alt="Visual CAPTCHA" />
  <input type="text" aria-label="Enter CAPTCHA text" />
  <button onClick={playAudioCaptcha}>Listen to audio CAPTCHA</button>
</div>

// FAIL — blocking paste on password fields
<input
  type="password"
  onPaste={(e) => e.preventDefault()}    // VIOLATES 3.3.8
/>

// FAIL — custom keyboard that prevents password manager
// FAIL — requiring users to transcribe characters from an image
// FAIL — requiring users to remember a specific personal content (what's in this photo?)
```

### What Counts as a Cognitive Function Test

| Test Type | Status | Why |
|-----------|--------|-----|
| Password (with paste allowed) | PASS | Password managers handle the cognitive load |
| Password (paste blocked) | FAIL | Forces memorization |
| Visual CAPTCHA (only) | FAIL | Requires transcription |
| Visual CAPTCHA + audio alternative | PASS | Alternative provided |
| Object recognition CAPTCHA | PASS | Recognition, not recall |
| SMS/email code (with autofill) | PASS | Copy-paste, autofill available |
| Passkey / biometric | PASS | No cognitive test |
| OAuth / SSO | PASS | Delegated authentication |
| "Select your profile photo" | FAIL | Requires recall of personal content |
| Security questions | FAIL | Requires recall |
| Puzzle CAPTCHA (drag piece) | Depends | Must have non-drag alternative (2.5.7) |

### Rules

1. **Never block paste** on password or code input fields
2. **Support password managers** via proper `autoComplete` attributes
3. **Provide alternatives** for any cognitive test (audio for visual CAPTCHA)
4. **Prefer authentication methods** that don't require cognitive tests (OAuth, passkeys, magic links)
5. **If re-authentication is required**: preserve the user's data and restore their session after
