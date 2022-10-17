import { Answers } from 'inquirer';
import type { Node, NodeId, NodeScenario, NodeSetState } from '../../types';
import { idNodes } from '../markdownToNode';

export const INTERNAL_CURRENT_TOPIC: string = '__INTERNAL__currentTopic';
export const INTERNAL_CONTINUE_CONVERSATION: string =
  '__INTERNAL__continueConversation';
export const INTERNAL_EXIT_CONVERSATION: string =
  '__INTERNAL__exitConversation';
export const INTERNAL_PREVIOUS_CARD: string = '__INTERNAL__previousCard';

export const getState = (node: Node): Record<string, unknown> => {
  const state: Record<NodeId, Record<string, unknown>> = {
    global: {},
    current: node.state,
  };

  idNodes.forEach((node: Node) => {
    if (node.id !== undefined) {
      state.global[node.id] = node.state;
    }
  });

  return state;
};

export const updateState = (
  node: Node,
  currentScenario: NodeScenario,
  answers: Answers
): void => {
  const state = node.state;
  const setStates = [
    ...node.content,
    { type: 'set-state', content: currentScenario.setStates },
  ].filter((c) => c.type === 'set-state');

  if (node.type === 'Conversation') {
    if (answers.action.action === INTERNAL_EXIT_CONVERSATION) {
      state[INTERNAL_CURRENT_TOPIC] = null;
    } else if (answers.action.action === INTERNAL_CONTINUE_CONVERSATION) {
      state[INTERNAL_CURRENT_TOPIC] = null;
    } else {
      state[INTERNAL_CURRENT_TOPIC] = answers.action;
    }
  }

  for (const setState of setStates) {
    for (const { variable, expression } of setState.content as NodeSetState) {
      let { left, operator, right } = expression;

      let variableName = variable;
      let nodeId: NodeId | undefined;
      if (variable.includes('.')) {
        const variableParts = variable.split('.');
        nodeId = variableParts[0];
        variableName = variableParts[1];
      }

      let newValue;

      const nodeState =
        nodeId !== undefined ? (idNodes.get(nodeId) as Node).state : node.state;

      if (right !== undefined) {
        left = (
          left in nodeState ? (nodeState[left] as number) : left
        ) as number;
        right = (right in nodeState ? nodeState[right] : right) as number;

        switch (operator) {
          case '-':
            newValue = left - right;
            break;
          case '+':
            newValue = left + right;
            break;
          case '/':
            newValue = left / right;
            break;
          case '*':
            newValue = left * right;
            break;
        }
      } else {
        left = (left in nodeState ? nodeState[left] : left) as number | string;

        if (left === 'true') {
          newValue = true;
        } else if (left === 'false') {
          newValue = false;
        } else {
          newValue = left;
        }
      }

      nodeState[variableName] = newValue;
    }
  }
};
