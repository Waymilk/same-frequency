import test from "node:test";
import assert from "node:assert/strict";

import { signalValidationError } from "../app/api/rooms/route.ts";

const completeAnswers = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => [index, index % 6]),
);
const completeScores = {
  emotion: 72,
  energy: 68,
  mainstream: 80,
  discovery: 64,
  nostalgia: 76,
  live: 70,
};

test("accepts a complete 16-question signal", () => {
  assert.equal(signalValidationError({
    answers: completeAnswers,
    scores: completeScores,
  }), "");
});

test("reports the exact missing question instead of a generic incomplete error", () => {
  const answers = { ...completeAnswers };
  delete answers[7];

  assert.equal(
    signalValidationError({ answers, scores: completeScores }),
    "有 1 道题未保存，请返回第 8 题继续",
  );
});

test("rejects answer values outside the six options and skip sentinel", () => {
  assert.equal(
    signalValidationError({
      answers: { ...completeAnswers, 4: 6 },
      scores: completeScores,
    }),
    "答题结果格式异常，请重新选择对应题目",
  );
});
