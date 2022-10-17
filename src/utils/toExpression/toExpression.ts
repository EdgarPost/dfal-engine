import type { ExpressionOperator, Expression } from '../../types';
import { isNumber } from '../isNumber';

export const expressionOperators: ExpressionOperator[] = ['-', '+', '/', '*'];

export const toExpression = (
  input: string,
  operator: ExpressionOperator
): Expression | undefined => {
  if (input.includes(operator)) {
    let [left, right] = input.split(operator);

    left = left.trim();
    right = right.trim();

    if (isNumber(right)) {
      (right as unknown) = Number(right);
    }

    return { left, operator, right };
  }
};
