import { UUID } from '../../server';
import type {
  Node,
  NodeId,
  NodeItem,
  NodeScenario,
  NodeState,
  ScenarioAction,
} from '../../types';
import { getNodeState, INTERNAL_CURRENT_TOPIC } from '../updateState';

export const includeScenario = async (
  scenario: NodeScenario,
  state: NodeState,
  gameId: UUID
): Promise<boolean> => {
  let conditionsMet = 0;
  for (const condition of scenario.conditions) {
    let { left, operator, right } = condition;

    const leftVariable = String(left);
    let nodeId: NodeId | undefined;

    if (String(leftVariable).includes('.')) {
      const variableParts = leftVariable.split('.');
      nodeId = variableParts[0];
      left = variableParts[1];
    }

    let nodeState = state;
    if (nodeId !== undefined) {
      nodeState = await getNodeState(nodeId, gameId);
    }

    left = (left in nodeState ? nodeState[left] : left) as number | string;
    right = (
      typeof 'right' === 'string' && (right as string) in nodeState
        ? nodeState[right as string]
        : right
    ) as number | string | boolean;

    if (right === 'false') {
      right = false;
    }

    if (right === 'true') {
      right = true;
    }

    switch (operator) {
      case '=':
        // eslint-disable-next-line eqeqeq
        if (left == right) {
          conditionsMet++;
        }
        break;
      case '>':
        if (left > right) {
          conditionsMet++;
        }
        break;
      case '<':
        if (left < right) {
          conditionsMet++;
        }
        break;
      case '<=':
        if (left <= right) {
          conditionsMet++;
        }
        break;
      case '>=':
        if (left >= right) {
          conditionsMet++;
        }
        break;
    }
  }

  return conditionsMet === scenario.conditions.length;
};

export const getScenarioByTitle = (
  node: Node,
  title: string
): NodeItem | undefined => {
  const scenarios = node.content.filter((c) => c.type === 'scenario');

  return scenarios.find(
    (scenario) => (scenario.content as NodeScenario).title === title
  );
};

export const getScenario = async (node: Node, gameId: UUID): Promise<NodeScenario | undefined> => {
  const state = node.state;
  const scenarios = node.content.filter((c) => c.type === 'scenario');

  for (const scenario of scenarios) {
    const content = scenario.content as NodeScenario;

    if (
      INTERNAL_CURRENT_TOPIC in state &&
      state[INTERNAL_CURRENT_TOPIC] !== null
    ) {
      const currentTopic = (state[INTERNAL_CURRENT_TOPIC] as ScenarioAction)
        .text;

      if (content.title === currentTopic) {
        return content;
      }

      continue;
    }

    const doIncludeScenario = await includeScenario(
      scenario.content as NodeScenario,
      state,
      gameId
    );

    if (doIncludeScenario) {
      return scenario.content as NodeScenario;
    }
  }
};
