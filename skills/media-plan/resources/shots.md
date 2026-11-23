# Shots: sizes, cuts and the shot list

How to turn beats into shots that cut together, when every shot is a separate generation. The film rules come from editing and cinematography sources in [SOURCES.md](../SOURCES.md). The camera words themselves (each move, lens and angle, in each model's own words) are in media-prompt's `camera.md`; this file decides which shot, media-prompt writes it.

## Contents

- [One shot, one generation](#one-shot-one-generation)
- [Shot sizes](#shot-sizes)
- [Coverage: wide first, then closer](#coverage-wide-first-then-closer)
- [Cuts that hold together](#cuts-that-hold-together)
- [Lens and distance](#lens-and-distance)
- [Framing for 9:16](#framing-for-916)
- [The shot list](#the-shot-list)
- [FAIL and PASS](#fail-and-pass)

## One shot, one generation

| Model | A shot can hold |
| --- | --- |
| Wan 2.2 | About 5 s: one camera move and one change |
| LTX-2.5 | 5 to 10 s: two to four beats, in time order, one move |
| A still | One moment, no move |

A beat that needs two moves or two changes is two shots. A shot shorter than its clip is fine: cut it in the edit. Plan each shot's seconds from the voice draft ([production.md](./production.md#the-order)).

## Shot sizes

| Size | Shows | Use it for |
| --- | --- | --- |
| Extreme wide | The place, the subject tiny | Scale, the hook of a giant or a city |
| Wide | The whole subject in its place | Where we are, who is where |
| Full | Head to feet | A body in action |
| Medium | Waist up | Talking, handling things |
| Close-up | The face | A reaction, a line |
| Extreme close-up, insert | One detail: an eye, a hand, a prop | The thing the story turns on |

Change size between cuts. Two shots of the same size and angle side by side read as a mistake.

## Coverage: wide first, then closer

StudioBinder's coverage advice is to start with the widest shot and move closer. For an AI piece that is also the safest order to make the stills in, because edits zoom in well and zoom out badly:

1. The **master** is the widest shot, with every character and the place in it.
2. Closer shots are crops and re-angles of the master.
3. **Inserts** reframe something already in the master. **Cutaways** show something that is not (a bird, the sky, a face in a window) and need their own still, made from the master's look.

## Cuts that hold together

| Rule | What it means | In a plan |
| --- | --- | --- |
| 180-degree line | Draw a line between the two characters, or along the way someone moves. The camera stays on one side, so left stays left | Name the side in the look bible ("camera on the farmhouse side"). Every shot's still keeps it |
| Screen direction | Someone walking right keeps walking right in the next shot | Say the direction in each shot's change |
| 30-degree rule | Between two shots of the same subject, move the camera at least 30 degrees or change size clearly, or the cut reads as a jump | Two shots of one subject differ in size or angle |
| Eyeline match | Cut from someone looking to what they see, at the same angle | The look shot's eyes point at where the next shot is |
| Shot, reverse shot | Two people facing each other, cut between them, both from the same side of the line | Character A looks screen right, B looks screen left |
| Match on action | Cut in the middle of a movement to a closer shot of it | Shot A ends as the fist starts to swing; shot B starts mid-swing |
| Match cut | Cut between two things of the same shape or motion: a moon to an eye | Plan both stills with the shape in the same place in the frame |
| Jump cut | A cut that skips time in the same framing | Only on purpose |

The match cut and match on action are hard to land between two generations. Plan them as a first-and-last-frame pair, or give shot B a start frame made from shot A's last frame.

## Lens and distance

| Lens | Does | Use it for |
| --- | --- | --- |
| Wide, 14 to 24mm | Shows a lot, near things loom | Establishing, scale, a low hero angle |
| Normal, 35 to 50mm | Close to the eye | Most shots |
| Long, 85mm and up | Far things stack up behind the subject | Close-ups, a big thing looming behind a small one |

The ASC's Jay Holben: the distance to the camera, not the focal length, makes a face look stretched or flat. A wide lens is close, a long lens is far. Write both: "a close-up from far back on a long lens".

## Framing for 9:16

- **Keep the bottom third clear** of faces and anything that must be read. Meta's Reels ad specs ask for the bottom 35% free of text and logos; the app's caption and buttons sit there. TikTok and YouTube publish no fixed numbers for ordinary posts.
- **Faces in the middle band,** off-center to one side. Centering versus the rule of thirds is preference: platform guides center, the Vertical Film Festival's founder keeps thirds.
- **Vertical moves suit a tall frame.** A tilt, a rise, a fall or a low angle uses the height. The same festival founder says horizontal movement is not vertical's strong suit.
- **Wides show less across.** A 9:16 wide holds a tall thing well (a giant, a tower) and a wide landscape badly.

## The shot list

One row per shot. These columns go in every plan:

| Column | What goes in it |
| --- | --- |
| # | Shot number |
| Sec | Seconds in the final cut |
| Framing | Size and angle |
| Move | One camera move, or static |
| Lens | Wide, normal or long, with a number |
| Light | The key's direction and quality, in the look bible's words |
| Change | The one thing that happens (two to four on LTX) |
| Sound | Voice line, effect, ambience |
| Route | The still's model, then the video model ([production.md](./production.md#pick-the-route)) |

Boords' shot list template gives shot number, description, size, angle and movement as the minimum, and most crews add lens and audio. The route column is this skill's.

## FAIL and PASS

FAIL, one Wan shot:

```text
| 2 | 8 | Wide then close-up | Orbit then push in | 24mm | Dramatic | She draws the sword, fights, wins | Epic music | Wan 2.2 |
```

Eight seconds on a 5-second model, two sizes, two moves, three changes, and light and sound with nothing to draw or hear.

PASS, split into two:

```text
| 2 | 4 | Full shot, low angle | Slow push in | 24mm | Low sun from the left | She draws the sword from its sheath | Steel ring, wind | Edit of the master, Wan 2.2 I2V |
| 3 | 3 | Close-up | Static | 85mm | Low sun from the left | Her eyes lift to the creature | Wind, VO 2 | Edit of the master, Wan 2.2 I2V |
```
