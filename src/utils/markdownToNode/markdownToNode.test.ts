import { markdownToNode } from './';

describe('tokensToNode', () => {
  describe('title', () => {
    it('should get the node title', () => {
      const md = `# Node title`;
      const node = markdownToNode(md);

      const title = node.content.find((c) => c.type === 'title');

      expect(title).toEqual({
        type: 'title',
        content: 'Node title',
      });
    });
  });

  describe('type', () => {
    it('should get the correct type', () => {
      const md = `---
type: Foo
---`;
      const node = markdownToNode(md);

      expect(node.type).toBe('Foo');
    });
  });

  describe('state', () => {
    it('should get the default state', () => {
      const md = `---
type: Foo
count: 0
hello: world
---`;
      const node = markdownToNode(md);

      expect(node.state).toStrictEqual({
        count: 0,
        hello: 'world',
      });
    });
  });

  describe('scenario', () => {
    it('should retrieve the scenarios', () => {
      const md = `
## Scenario 1
This is scenario 1
## Scenario 2
This is scenario 2
`;
      const node = markdownToNode(md);

      const scenarios = node.content.filter((c) => c.type === 'scenario');

      expect(scenarios).toStrictEqual([
        {
          type: 'scenario',
          content: {
            actions: [],
            conditions: [],
            setStates: [],
            text: ['This is scenario 1'],
            title: 'Scenario 1',
          },
        },
        {
          type: 'scenario',
          content: {
            actions: [],
            conditions: [],
            setStates: [],
            text: ['This is scenario 2'],
            title: 'Scenario 2',
          },
        },
      ]);
    });

    it('should retrieve conditions from a scenario', () => {
      const md = `
## Scenario 1
\`\`\`condition
count = 1
hello = world
\`\`\`
`;
      const node = markdownToNode(md);

      const scenarios = node.content.filter((c) => c.type === 'scenario');

      expect(scenarios).toStrictEqual([
        {
          type: 'scenario',
          content: {
            actions: [],
            conditions: [
              {
                left: 'count',
                operator: '=',
                right: 1,
              },
              { left: 'hello', operator: '=', right: 'world' },
            ],
            setStates: [],
            text: [],
            title: 'Scenario 1',
          },
        },
      ]);
    });

    it('should retrieve setStates from a scenario', () => {
      const md = `
## Scenario 1
\`\`\`set-state
count = count + 1
hello = foo
bar = false
\`\`\`
`;
      const node = markdownToNode(md);

      const scenarios = node.content.filter((c) => c.type === 'scenario');

      expect(scenarios).toStrictEqual([
        {
          type: 'scenario',
          content: {
            actions: [],
            conditions: [],
            setStates: [
              {
                variable: 'count',
                expression: {
                  left: 'count',
                  operator: '+',
                  right: 1,
                },
              },
              {
                variable: 'hello',
                expression: {
                  left: 'foo',
                },
              },
              {
                variable: 'bar',
                expression: {
                  left: 'false',
                },
              },
            ],
            text: [],
            title: 'Scenario 1',
          },
        },
      ]);
    });

    it('should retrieve setStates from a scenario', () => {
      const md = `
## Scenario 1
\`\`\`set-state
count = count + 1
hello = foo
bar = false
\`\`\`
`;
      const node = markdownToNode(md);

      const scenarios = node.content.filter((c) => c.type === 'scenario');

      expect(scenarios).toStrictEqual([
        {
          type: 'scenario',
          content: {
            actions: [],
            conditions: [],
            setStates: [
              {
                variable: 'count',
                expression: {
                  left: 'count',
                  operator: '+',
                  right: 1,
                },
              },
              {
                variable: 'hello',
                expression: {
                  left: 'foo',
                },
              },
              {
                variable: 'bar',
                expression: {
                  left: 'false',
                },
              },
            ],
            text: [],
            title: 'Scenario 1',
          },
        },
      ]);
    });
  });

  describe('actions', () => {
    it('should retrieve the actions', () => {
      const md = `
## Scenario 1
1. Action A: [[AnotherNode]]
2. Action B: [[../NodeActionB]]
2. Action C: [[NodeC]]
`;
      const node = markdownToNode(md);

      const scenarios = node.content.filter((c) => c.type === 'scenario');

      expect(scenarios).toStrictEqual([
        {
          type: 'scenario',
          content: {
            actions: [
              {
                text: 'Action A',
                action: 'AnotherNode',
              },
              {
                text: 'Action B',
                action: '../NodeActionB',
              },
              {
                text: 'Action C',
                action: 'NodeC',
              },
            ],
            conditions: [],
            setStates: [],
            text: [],
            title: 'Scenario 1',
          },
        },
      ]);
    });
  });
});
