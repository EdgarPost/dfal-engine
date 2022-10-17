import type { Condition, ConditionOperator } from '../../types';
import { isNumber } from '../isNumber';

export const conditionOperators: ConditionOperator[] = [
  '>=',
  '<=',
  '=',
  '<',
  '>',
];

export const toCondition = (
  input: string,
  operator: ConditionOperator
): Condition | undefined => {
  if (input.includes(operator)) {
    let [left, right] = input.split(operator);

    left = left.trim();
    right = right.trim();

    if (isNumber(right)) {
      (right as unknown) = Number(right);
    } else {
      if (['>', '<', '>=', '<='].includes(operator)) {
        throw new Error(`Invalid string expression "${input}"`);
      }
    }

    return { left, operator, right };
  }
};
