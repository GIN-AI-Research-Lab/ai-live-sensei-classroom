# AI Live Sensei Classroom

**A live, voice-first AI language classroom — a teacher you can talk to, interrupt, and learn from.**

Learners listen to a friendly AI teacher (a cat named *Sensei*) deliver structured lessons by voice, interrupt at any moment to ask questions, practise speaking into the microphone, and get corrected on the spot. Each lesson plays out on a visual "stage" where words, furigana, stroke-by-stroke characters and illustrations appear in sync with the teacher's speech — like a polished video lesson, but fully interactive.

> **Status: working prototype under active development.** Today the product teaches **Japanese to Vietnamese speakers** (beginner to JLPT N1). Our direction is to grow it into a **multi-language platform** (English, Japanese, Korean and more, for learners of many native languages). See [Vision](#vision) and [Roadmap](#roadmap).

---

## See it in action

Lesson **N5 – Unit 1** running in two of the available stage styles. The teacher speaks; the word being read lights up, characters are drawn stroke by stroke, and illustrations arrive on cue.

| *Classroom Chalkboard* style | *Layered Paper-Cut* style |
|:---:|:---:|
| ![Classroom Chalkboard](docs/demo/demo-s.gif) | ![Layered Paper-Cut](docs/demo/demo-h.gif) |

**Videos with sound** (45 seconds each, with the teacher's synthesised voice): [Classroom Chalkboard](docs/demo/demo-s.mp4) · [Layered Paper-Cut](docs/demo/demo-h.mp4)

**The parts of a lesson** — vocabulary, kanji, grammar pattern, example sentence, dialogue, exercise:

| Classroom Chalkboard | Layered Paper-Cut |
|:---:|:---:|
| ![Vocabulary](docs/demo/s-1-tu-vung.jpg) | ![Vocabulary](docs/demo/h-1-tu-vung.jpg) |
| ![Kanji](docs/demo/s-2-chu-han.jpg) | ![Kanji](docs/demo/h-2-chu-han.jpg) |
| ![Grammar](docs/demo/s-3-mau-cau.jpg) | ![Grammar](docs/demo/h-3-mau-cau.jpg) |
| ![Example](docs/demo/s-4-vi-du.jpg) | ![Example](docs/demo/h-4-vi-du.jpg) |
| ![Dialogue](docs/demo/s-5-hoi-thoai.jpg) | ![Dialogue](docs/demo/h-5-hoi-thoai.jpg) |
| ![Exercise](docs/demo/s-6-bai-tap.jpg) | ![Exercise](docs/demo/h-6-bai-tap.jpg) |

*All images and clips were recorded from the application's own lesson playback (simulation mode, so no live service was used for the picture), with the teacher and dialogue characters voiced by AI speech synthesis. This is a prototype.*

---

## The problem

- **Self-study materials are silent.** Textbooks and most apps are cheap but offer no one to talk to and no one to correct pronunciation or grammar in the moment.
- **Human tutors are expensive and hard to schedule.** They work, but they do not scale to the millions of people who want to learn a language.
- **Most apps are quiz-first.** Speaking and listening — the skills learners most want and most lack — get the least attention.
- **Localised, high-quality explanations are scarce** for many learner groups (for example, Vietnamese speakers learning Japanese, with Sino-Vietnamese readings and memory aids that exploit their native language).

## The solution

A classroom in which a **real-time conversational AI voice** plays the teacher:

1. **Two-way spoken teaching.** The teacher lectures; the learner can speak over it at any time. The teacher stops immediately, answers, and returns to the lesson.
2. **Structured, curriculum-driven lessons.** The teacher walks through vocabulary, characters, grammar patterns, examples, dialogues and exercises in order, and stays on topic.
3. **A stage synchronised with speech.** Highlights, stroke order, illustrations and effects follow the teacher's words with sub-second timing.
4. **Multi-character dialogues.** Each dialogue character has a fixed, distinct voice, a lip-synced portrait and emotion-dependent expressions and intonation.
5. **Speaking practice with instant correction.** Learners speak into the microphone; the teacher detects errors and shows the correction directly on the lesson.

---

## What is built today

| Area | Details |
|---|---|
| **Curriculum** | **110 lessons**, from a beginner kana course (10 lessons) through **N5 (25), N4 (25), N3 (20), N2 (15) and N1 (15)**. Vocabulary, kanji (readings, stroke order, mnemonics), grammar patterns, examples, dialogues and exercises. Every token carries a unique ID so the AI can point at exact words on screen. |
| **Live voice teaching** | Bidirectional streaming audio, natural barge-in, and teacher-controlled slides and highlights. Mixed-language speech (the learner's language plus the target language) is pronounced correctly sentence by sentence. |
| **Illustrations** | **1,500+** images for vocabulary and scenes, generated with an open-source image model (Apache-2.0), plus a cast of 28 characters × 8 facial expressions. |
| **Character voices and lip-sync** | 28 dialogue characters, each with a fixed voice (14 male, 14 female); mouth shapes follow the actual audio; expression and intonation follow the emotion of each line. |
| **Stage styles** | Selectable lesson looks — *Default*, *Layered Paper-Cut* and *Classroom Chalkboard* — each with a matching idle screen. |
| **Video lesson pipeline** | The same stage can be rendered with real synthesised speech into a **full-length lesson video** (for example, Unit 1 of N5 in roughly 30 minutes at 1080p) — so the same content powers both an interactive web classroom and a video channel. |
| **Automated layout QA** | A test harness that checks every lesson on desktop and phone for clipped or overlapping text, small type, empty space and animation hitches. |

## Why it is different

- **Speaking and listening first**, not just quizzes.
- **One content source, two channels:** the same lesson drives the interactive web classroom *and* long-form video for a content channel.
- **Low content cost:** open-source image generation and structured, data-driven lessons keep the cost of adding material low.
- **Built around the learner's own language:** explanations, memory aids and examples are written for a specific audience rather than translated generically.

---

## Vision

Language learning should feel like sitting in a class with a patient teacher who speaks *your* language — in any direction.

Today the platform covers one pair: **Japanese for Vietnamese speakers**. The lesson format, the stage engine, the character and voice system, and the QA tooling are content-driven, so they are designed to extend to other pairs. The plan is to broaden along two axes:

- **Target languages:** English, Japanese, Korean first, then further languages (for example Chinese, Spanish, French, Thai, Indonesian).
- **Learner languages:** instead of only Vietnamese, explanations and coaching in the learner's own language, starting with the largest learner communities in Asia and growing from there.

Extending to a new language is not just translation. It needs a curriculum written for that language pair, casting and testing of voices, script-aware rendering (for example Hangul, or romanisation and pitch for tonal languages), and review by native teachers. Those are the items sponsorship would fund.

## Roadmap

| Phase | Goal |
|---|---|
| **1 — Harden the core** *(in progress)* | Finish the layout-quality pass across all 110 lessons on desktop and phone; improve stage performance; stabilise the voice pipeline. |
| **2 — Pilot with learners** | Deploy a hosted version with accounts and usage limits; run a pilot with a small group of Vietnamese learners of Japanese; measure learning outcomes and retention; review content with native teachers. |
| **3 — Video channel** | Produce the lesson video series for all levels from the same curriculum and publish it alongside the interactive classroom. |
| **4 — Second and third language** | Add **English** and **Korean** courses (learner languages to be chosen from pilot demand), including voices, script rendering and teacher review. |
| **5 — Open the platform** | A documented content format and tooling so teachers and communities can author lessons for new language pairs. |

## How sponsorship helps

This is an independent project. Support would be used for:

| Area | What it funds |
|---|---|
| **AI voice usage** | Real-time voice sessions are billed by usage; budget is needed for the pilot and for generating lesson audio at scale. |
| **Hosting and security** | Moving from a local development server to a hosted service with accounts, usage limits and proper secret handling. |
| **Content and review** | Native-speaker teachers to review and extend curricula, and to write new language pairs. |
| **Images and video** | Generating and reviewing more illustrations; producing the video lesson series. |
| **Devices and testing** | Testing on a range of phones, browsers and network conditions. |

A detailed budget and milestone plan are available on request.

**Want to sponsor, collaborate on content, or pilot with learners?** Please get in touch via the maintainer's GitHub profile: [github.com/trituenguyen97](https://github.com/trituenguyen97).

---

## Try it locally

Requirements: Python 3, a modern Chrome or Edge browser, and a microphone if you want to speak.

```bash
# 1) Download the front-end libraries (one time, after cloning)
python tools/setup_vendor.py

# 2) Create the configuration file that holds the voice-service key
cp .env.example .env
#   open .env and fill in the key as described in the comments

# 3) Start the development server
python server.py
#   then open http://localhost:3000
```

On Windows you can double-click `start.bat` instead.

**Preview without a key and at no cost:** open `http://localhost:3000/?noLive&moPhong` to play a lesson in simulation mode (synthetic placeholder audio, no external service). Add `&phongCach=h` for the *Layered Paper-Cut* style or `&phongCach=s` for the *Classroom Chalkboard* style.

> ⚠️ This is a development server. By default it listens on `127.0.0.1` only. **Do not** expose it to the internet, and **do not** use static file servers that serve the whole project folder (they would expose your `.env`). `.env` and `env.js` are never committed to git.

## Repository layout

```
index.html            Classroom interface
css/  js/             UI, lesson controller, audio, and the stage (js/che-do/ = stage styles)
curriculum/           Lessons: kana, n5 … n1 (one JSON file per lesson), plus characters and voices
assets/               Illustrations, character portraits, stage backgrounds
tools/                Curriculum builders, layout QA (tools/che-do/), lesson-video pipeline (tools/che-do/video/), image-generation pipeline (tools/anh-ai/)
docs/demo/            Demo images and clips used in this README
docs/che-do/          Design notes and development process for the stage styles
server.py  start.bat  Development server and Windows quick-start
```

## License and notes

- Illustrations are generated with an open-source model (Apache-2.0); the pipeline is documented in `tools/anh-ai/`.
- No software license file is included yet. Please contact the maintainer if you would like to reuse the source code.
- Source code comments and some internal documentation are written in Vietnamese.
