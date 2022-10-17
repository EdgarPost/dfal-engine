import { isNumber } from './';

describe('isNumber', () => {
  it('should return true when a number is passed', () => {
    expect(isNumber('13')).toBe(true);
  });

  it('should return true when a float is passed', () => {
    expect(isNumber('1.3')).toBe(true);
  });

  it('should return false when a string is passed', () => {
    expect(isNumber('hello')).toBe(false);
  });

  it('should return false when an empty string is passed', () => {
    expect(isNumber(' ')).toBe(false);
  });
});
