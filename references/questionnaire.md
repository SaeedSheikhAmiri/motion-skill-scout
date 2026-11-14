# Interview guide

The interview is the difference between a recommendation and a random list. Keep it to **two rounds, four questions each**, in the user's language.

## Rules

1. **Ask only what changes the answer.** If the user already said “vertical reel for Instagram”, skip aspect and output.
2. **Offer concrete options, always allow free text.** “Not sure yet” is a valid answer and should lead to one clarifying question, not a lecture.
3. **Do not ask for secrets, footage or brand assets.** This stage is about intent, not files.
4. **Do not install during the interview.** Nothing is downloaded until Step 4 approval.
5. **Mirror the user's vocabulary.** If they say «موشن», say موشن; do not correct them to “motion graphics”.

## Round A — the project

| # | English | فارسی | Options |
|---|---|---|---|
| 1 | What are you making? | چه چیزی می‌سازید؟ | talking-head reel · product/brand promo · explainer · social shorts · data/map video · math/3D · not sure |
| 2 | Which engine or tool do you want? | با چه موتور یا ابزاری کار می‌کنید؟ | Remotion + React · HTML/CSS/GSAP · After Effects/Premiere only · no preference |
| 3 | Delivery format? | فرمت تحویل؟ | 9:16 vertical · 16:9 landscape · 1:1 square · both |
| 4 | Language and direction? | زبان و جهت متن؟ | Persian/Arabic (RTL) · English/Latin · bilingual · other |

Persian option labels, ready to paste:

```text
۱. ریلز گفتارمحور · پروموی محصول یا برند · ویدیوی توضیحی · شورت اجتماعی · ویدیوی داده یا نقشه · ریاضی/سه‌بعدی · هنوز نمی‌دانم
۲. Remotion و React · HTML/CSS/GSAP · فقط After Effects یا Premiere · فرقی نمی‌کند
۳. عمودی ۹:۱۶ · افقی ۱۶:۹ · مربع ۱:۱ · هر دو
۴. فارسی/عربی (راست‌به‌چپ) · انگلیسی · دوزبانه · زبان دیگر
```

## Round B — the constraints that filter licenses and stacks

| # | English | فارسی | Options |
|---|---|---|---|
| 5 | Do you have footage? | فوتج دارید؟ | raw talking head · product shots · no footage, motion only |
| 6 | Captions? | زیرنویس؟ | burned-in, word-timed · SRT only · none |
| 7 | Usage? | مصرف؟ | commercial client work · personal · open source |
| 8 | Experience? | تجربه؟ | first project · comfortable with code · I want a full pipeline |

Persian option labels:

```text
۵. گفتار خام · تصویر محصول · فوتج ندارم، فقط موشن
۶. زیرنویس سوخته و هم‌زمان با کلمه · فقط SRT · بدون زیرنویس
۷. کار تجاری برای مشتری · شخصی · اوپن‌سورس
۸. اولین پروژه · با کد راحتم · یک پایپ‌لاین کامل می‌خواهم
```

## Optional — only if the look is still unknown

> Pick a visual direction / یک جهت بصری انتخاب کنید:

`paper / dossier / collage` · `clean tech` · `bold kinetic type` · `news / data` · `cinematic` · `no preference`

Persian: کاغذ/دوسیه/کلاژ · فناوری تمیز · تایپوگرافی جنبشی · خبر/داده · سینمایی · فرقی نمی‌کند

## Answer → JSON mapping

| Question | Key | Allowed values |
|---|---|---|
| 1 | `output` | `talking-head`, `promo`, `explainer`, `shorts`, `data`, `math-3d`, `unsure` |
| 2 | `engine` | `remotion`, `html`, `after-effects`, `manim`, `none` |
| 3 | `aspect` | `9:16`, `16:9`, `1:1`, `both` |
| 4 | `language` | `fa`, `ar`, `en`, `bilingual`, `other` |
| 5 | `footage` | `talking-head`, `product`, `none` |
| 6 | `captions` | `burned`, `srt`, `none` |
| 7 | `usage` | `commercial`, `personal`, `open-source` |
| 8 | `level` | `beginner`, `advanced`, `full-pipeline` |
| optional | `style` | `paper-dossier`, `clean-tech`, `kinetic`, `news-data`, `cinematic`, `none` |

Omit keys the user did not answer. Never invent an answer to make the ranking look decisive.

## Branch rules

- **`math-3d`** → engine `manim` unless the user objects; baseline becomes `Yusuke710/manim-skill`.
- **`after-effects`** → no baseline. Explain in one sentence: *the skills generate assets with alpha; you import them into AE/Premiere.* Prefer packs tagged `alpha`.
- **`usage: commercial`** → exclude `noncommercial` packs, warn on `unclear` licenses. Do not soften this.
- **`language: fa/ar/bilingual`** → say plainly that most motion packs have no RTL guidance. Recommend `sudadom/arabic-motion-graphics-skill` as a reference and require a bidi test.
- **`level: beginner`** → lead with a pipeline or official baseline; three items maximum.
- **`level: full-pipeline`** → a pipeline pack may replace the split between baseline and primary; still cap at three installs.
- **No footage** → utility such as silence removal is irrelevant; omit it.
- **Existing Remotion project** → do not recommend a pack that wants to own the project root (e.g. digitalsamba) without saying so.

## Tone

- One sentence per item: what it gives you, why it matches, what to watch.
- No hype. “This is the best” is not a reason; “it handles word timing with your existing transcript” is.
- If two options are close, say which is cheaper to abandon.
- After the plan, stop and ask. Do not fill the silence with more recommendations.