# Easy Read rules: detail and examples

Read this when the source is long, technical or legal, or when `validate.py` keeps flagging the same kind of problem.

## What `validate.py` checks

| Check | Limit |
| --- | --- |
| Words per sentence | 15 or fewer |
| Contractions | None (`don't`, `it's`, `you'll`, `we're`…). Possessives like `the council's` are fine. |
| Title | 8 words or fewer |
| Summary | 80 words or fewer |
| Headings | Not empty |
| Image keyword | On every sentence, and in the image map |
| Image reuse | No image beside more than 3 sentences |

It also warns (does not fail) when a sentence is one long list joined by commas, or when a number is written as a word.

## Rewriting examples

**One idea per sentence**

- Before: "You must bring your ID and proof of address, and if you cannot, you should call us first."
- After:
  - "You must bring your ID."
  - "You must bring proof of where you live."
  - "Can you not bring these? Call us first."

**Active voice, "you" and "we"**

- Before: "Applications will be reviewed within ten working days."
- After: "We will look at your form within 10 working days."

**Defining a hard word**

- "You may need a referral."
- "A referral is a letter from your doctor to another service."

**Numbers and dates**

- Write figures: "3 times a day", "£25", "10 minutes".
- Write dates in full: "Monday 3 March", not "3/3".
- Avoid percentages when you can: "1 in 4 people", not "25%".

**Lists**

Turn each list item into its own sentence, so each gets a picture.

- Before: "Bring your passport, 2 bank statements, and a utility bill."
- After, under a heading such as "What to bring":
  - "Bring your passport."
  - "Bring 2 bank statements."
  - "Bring a bill for gas, water or electricity."

## Structure

- Use a section for each main topic in the source, with a short heading that says what it is about ("What to bring", "When to come").
- Aim for 3–10 sentences per section. Split a longer section into two.
- Put the most important information first: what the reader must do, and by when.
- Leave out things the reader does not need, such as legal references and internal process. Keep every right, deadline, cost and contact detail.
- End with who to contact and how, if the source includes it.

## Worked example

Source:

> Residents are reminded that garden waste collections will be suspended between 15 December and 12 January. Collections resume on the first scheduled day after this period. Please do not leave bins out during the suspension, as they may obstruct pavements.

```json
{
  "title": "Garden bin collections over winter",
  "summary": "We will not collect garden waste for a few weeks in winter. Collections stop on 15 December. They start again after 12 January.",
  "sections": [
    {
      "heading": "When we stop collecting",
      "sentences": [
        { "text": "We will not collect garden waste from 15 December.", "imageKeyword": "garden" },
        { "text": "We will start again after 12 January.", "imageKeyword": "calendar" }
      ]
    },
    {
      "heading": "What you need to do",
      "sentences": [
        { "text": "Please keep your garden bin at home until then.", "imageKeyword": "house" },
        { "text": "Bins on the pavement can get in people's way.", "imageKeyword": "walk" }
      ]
    }
  ]
}
```

The keywords above are examples. Always check them against `references/image-catalog.md`.
