import { Node } from '../../types';
import { updateState } from './';

describe('updateState', () => {
  it('should substract the value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 11,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'count',
                operator: '-',
                right: 5,
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(6);
  });

  it('should add the value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'count',
                operator: '+',
                right: 5,
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(11);
  });

  it('should multiply the value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'count',
                operator: '*',
                right: 2,
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(12);
  });

  it('should divide the value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'count',
                operator: '/',
                right: 3,
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(2);
  });

  it('should set the numeric value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 365,
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(365);
  });

  it('should set the string value', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'hello world',
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe('hello world');
  });

  it('should set a true (boolean)', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'true',
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(true);
  });

  it('should set a false (boolean)', () => {
    const node: Node = {
      type: 'Card',
      state: {
        count: 6,
      },
      content: [
        {
          type: 'set-state',
          content: [
            {
              variable: 'count',
              expression: {
                left: 'false',
              },
            },
          ],
        },
      ],
    };

    updateState(node);

    expect(node.state.count).toBe(false);
  });
});
