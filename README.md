# GRE Equal Words Trainer

A mobile-friendly vocabulary web app for GRE synonym practice. It includes three core modes:

## Features

### 1. Flashcard Mode
- Shows each item as a card containing:
  - A list of synonymous English words.
  - A Chinese definition.

### 2. Quiz Mode
- Each question presents a Chinese meaning.
- User selects **two correct words** from **six choices**:
  - 2 correct synonyms from the same entry.
  - 4 distractors from other entries.
- If correct: proceed automatically to the next question.
- If incorrect:
  - Highlights correct answers.
  - Adds the current question to the **wrong set**.
  - "Next Question" button appears for manual progression.

### 3. Wrong Set Practice
- Initially displays all wrong-set entries for review.
- During practice:
  - Requires selecting 2 correct synonyms out of 6.
  - Correct: green highlight, proceed after delay.
  - Incorrect: shows correct options, wait for user click.
  - Option to delete current question or exit training.

## JSON Data Format

The data file `vocab_dict.json` should be a dictionary structured as:

```json
{
  "1": [["synonym1", "synonym2", "synonym3"], "Chinese definition"],
  "2": [["wordA", "wordB", "wordC", "wordD"], "对应中文"],
  ...
}

Current json data is from Jiayi Zhu.
