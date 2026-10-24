# Example: one doc, cut end to end

A README section as AI tends to write it, then the same facts after the cut ladder and the sound list. No facts added. Two facts cut: both were claims with no source ("industry leading", "countless teams").

## Before (190 words)

> ## Introduction
>
> Welcome to TaskRunner, a powerful, cutting-edge, and robust task scheduling platform designed to streamline and revolutionise the way modern teams handle background jobs in today's fast-paced development landscape. TaskRunner is not just a scheduler, it is a complete job orchestration ecosystem that plays a crucial role in helping countless teams unlock seamless, effortless productivity.
>
> In this section, we will dive deep into what makes TaskRunner truly special and explore the comprehensive feature set that sets it apart from the competition.
>
> TaskRunner leverages a sophisticated architecture in which jobs are defined, then enqueued, then processed by workers, and finally their results are stored for later inspection. This powerful pipeline ensures that your jobs are handled with care at every stage of their lifecycle, symbolising our commitment to reliability, scalability, and performance.
>
> Industry experts widely agree that background processing is an essential cornerstone of modern application development, and TaskRunner stands proudly at the forefront of this exciting space.
>
> In summary, TaskRunner is a scheduler that runs your jobs in the background so your app does not have to wait for them. And that is the real power of TaskRunner.

## After (51 words)

> # TaskRunner
>
> TaskRunner runs jobs in the background, so your app does not wait for them.
>
> ```
> your code -> queue -> worker -> result store
> ```
>
> ## Run it
>
> ```bash
> npm install taskrunner
> ```
>
> ```js
> runner.add("send-email", { to: "a@b.com" });
> runner.start();
> ```
>
> ## Limits
>
> Jobs run once. If a job must never be lost, store it yourself before adding it.

## What changed

```
cut      "Introduction" heading and welcome        said nothing
cut      history and importance claims (no source) rungs 1, sound: borrowed authority
cut      last paragraph                            repeated line 1 word for word
picture  the architecture paragraph                became the 4 box flow
moved    nothing                                   no layer 5 needed
kept     install, the working example, the limit   the never cut list
words    190 -> 51
```

Layers check: 1 is line one. 2 is the flow. 3 is "Run it", example first. 4 is "Limits". 5 dropped, nothing needs it.

## Trim report format

End every trim with this shape, short:

```
Cut:     <section or claim> (<rung or tell>)
Cut:     ...
Moved:   <what went to layer 5, or "nothing">
Kept:    <never cut items touched, or "no change">
Words:   <before> -> <after>
Gaps:    <facts the source was missing, or "none">
```
