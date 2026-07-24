import assert from "node:assert/strict";
import test from "node:test";

import {
  BANK_SIZE,
  QUESTION_COUNT,
  legacyQuestionIds,
  questionBanks,
  questionCategories,
  questionSelectionError,
  questionsForIds,
  sampleQuestionIds,
} from "../lib/questions.ts";
import { storedQuestionIds } from "../app/api/rooms/route.ts";

function seededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
}

test("each channel has 36 valid, uniquely identified, category-balanced questions", () => {
  for (const [channel, questions] of Object.entries(questionBanks)) {
    assert.equal(questions.length, BANK_SIZE, channel);
    assert.equal(new Set(questions.map(({ id }) => id)).size, BANK_SIZE, channel);
    for (const question of questions) {
      assert.equal(question.options.length, 6, question.id);
      assert.equal(question.profileKeys.length, 6, question.id);
      assert.ok(questionCategories.includes(question.category), question.id);
    }
    for (const category of questionCategories) {
      assert.equal(questions.filter((question) => question.category === category).length, 6, `${channel}/${category}`);
    }
  }
});

test("balanced sampling returns 16 unique questions with 3/3/3/3/2/2 category quotas", () => {
  for (const channel of Object.keys(questionBanks)) {
    for (let seed = 1; seed <= 20; seed += 1) {
      const ids = sampleQuestionIds(channel, seededRandom(seed));
      assert.equal(ids.length, QUESTION_COUNT);
      assert.equal(new Set(ids).size, QUESTION_COUNT);
      const counts = questionCategories
        .map((category) => questionsForIds(channel, ids).filter((question) => question.category === category).length)
        .sort((a, b) => b - a);
      assert.deepEqual(counts, [3, 3, 3, 3, 2, 2]);
    }
  }
});

test("different random sessions produce different ordered question sets", () => {
  const first = sampleQuestionIds("chinese", seededRandom(1));
  const second = sampleQuestionIds("chinese", seededRandom(2));
  assert.notDeepEqual(first, second);
});

test("room selection validation rejects wrong length, duplicates and cross-channel ids", () => {
  const valid = sampleQuestionIds("chinese", seededRandom(7));
  assert.equal(questionSelectionError("chinese", valid), "");
  assert.match(questionSelectionError("chinese", valid.slice(0, 15)), /16/);
  assert.match(questionSelectionError("chinese", [...valid.slice(0, 15), valid[0]]), /重复/);
  assert.match(questionSelectionError("chinese", [...valid.slice(0, 15), "western-01"]), /跨频道/);
});

test("rooms without stored question ids fall back to the original ordered 16 questions", () => {
  const legacy = legacyQuestionIds("kpop");
  assert.deepEqual(storedQuestionIds("kpop", null), legacy);
  assert.deepEqual(storedQuestionIds("kpop", "not-json"), legacy);
  assert.deepEqual(storedQuestionIds("kpop", JSON.stringify(legacy)), legacy);
});
