# Lighting and the look bible

How to pick one light for the piece, keep it the same across shots that are each generated on their own, and write the look bible every hand-off line copies from. The light words for each model are in media-prompt's `camera.md`.

## Contents

- [Motivated light](#motivated-light)
- [Key, fill, rim](#key-fill-rim)
- [Hard or soft, high or low key](#hard-or-soft-high-or-low-key)
- [Light that matches across cuts](#light-that-matches-across-cuts)
- [The look bible](#the-look-bible)
- [FAIL and PASS](#fail-and-pass)

## Motivated light

Every light should come from a source the viewer could believe is there: the sun, a window, a fire, a lamp, a screen. Name the source, not the mood. "Low sun from the left through haze" draws; "dramatic lighting" doesn't. One source per scene: Lightricks asks for one consistent light on LTX-2.5, and mixed lights looked rendered in real runs.

## Key, fill, rim

```text
            rim (behind, outlines the edge)
                    *
                    |
   key  *------  subject  ------   fill (opposite, softer, or none)
 (main light,       |
  sets the side)  camera
```

| Light | Job | In a prompt |
| --- | --- | --- |
| Key | The main light. Its side and height set the mood | "low sun from the left" |
| Fill | Lifts the shadow side | "soft light on the shadow side", or leave out for hard contrast |
| Rim, back | Separates the subject from the background | "rim light on her shoulders from the sun behind" |

StudioBinder gives a 2:1 key-to-fill ratio as a common start. The ASC's Stephen Burum sets fill by eye and calls ratios a learning tool. A model can't meter, so write the contrast as words: "deep shadow on the right side of his face".

## Hard or soft, high or low key

| Choice | What sets it | Looks like |
| --- | --- | --- |
| Hard | A small source: bare sun, a bulb | Crisp shadows |
| Soft | A large or diffused source: overcast sky, a window with a curtain | Gentle shadows |
| High key | Lots of fill, bright | Light, upbeat, open |
| Low key | Little or no fill | Deep shadow: noir, horror, myth |

## Light that matches across cuts

The ASC (Burum) and No Film School agree: keep the light's direction, colour and quality the same from the wide to the close-up, and light the master first, then match the closer shots to it. Cinematographers cheat a light's exact position between setups; what must match is how it reads. For an AI piece:

- **The master still sets the light.** Every shot still is an edit of it, and each edit ends by keeping the light.
- **One light phrase, written once** in the look bible and used unchanged in every hand-off line that states the light: "low dawn sun from screen left through haze, hard and warm".
- **Keep the key on the same screen side** when the camera stays on one side of the 180-degree line. If a reverse shot flips the key to the other side, that is correct for the world, but say so in the plan.
- **A change in light is a beat,** not drift: dawn to noon, a lamp going out. Put it in the shot's Change column.
- **Mixed frame sources drift.** A Wan shot and an LTX shot of the same scene can come out warmer or cooler. Grade them to match in the finish.

## The look bible

One block the plan draws on. Write each line once, in words a model can draw, and never paraphrase it later. How much of it a hand-off line carries depends on the line:

- **A fresh still** (the master, a layer, a still wider than the master) carries each character's full words, the Light and the Medium. The master also carries the Place.
- **An edit or a video** uses each character's short name and only what changes, because the picture already shows the rest. It uses the Light words unchanged when it states the light.

| Line | What goes in it |
| --- | --- |
| Each character | A short name ("the rust giant"), spelled the same in every line. Then the full words: what must stay the same in every shot, such as build, material, face, clothes, one colour. Size if it matters. 15 to 30 words each |
| Place | The setting in one sentence, and one landmark that shows where we are |
| Palette | Two to four colours, named ("rust orange, moss green, wheat gold") |
| Light | The key's source, side and quality. Its colour |
| Medium | Film stock or medium: "35mm film still, Kodak Portra 400, natural grain". Naming a real medium made stills read as photos in real runs |
| Effect | The one impossible thing, if any, and which shots it is in |
| Screen direction | Who is on which side, facing where, and which side the camera stays on |
| Props to simplify | Hinged or small props, and how they appear: closed, held in one hand |

## FAIL and PASS

FAIL:

```text
Light: cinematic, moody, epic lighting, beautiful colours
```

PASS:

```text
Light: low dawn sun from screen left through valley haze, hard and warm; no fill, so the right side of each giant falls into blue shadow; the key stays on the left in every shot
```
