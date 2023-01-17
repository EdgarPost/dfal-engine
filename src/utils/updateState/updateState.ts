import { Answers } from 'inquirer';
import { redisClient, UUID } from '../../server';
import type {
  Node,
  NodeId,
  NodeScenario,
  NodeSetState,
  NodeState,
} from '../../types';

export const INTERNAL_CURRENT_TOPIC: string = '__INTERNAL__currentTopic';
export const INTERNAL_CONTINUE_CONVERSATION: string =
  '__INTERNAL__continueConversation';
export const INTERNAL_EXIT_CONVERSATION: string =
  '__INTERNAL__exitConversation';
export const INTERNAL_PREVIOUS_CARD: string = '__INTERNAL__previousCard';

export const getNodeState = async (
  gameId: UUID,
  nodeId: UUID,
  defaultState?: NodeState
): Promise<NodeState> => {
  const rawState = await redisClient.HGET('state', `${gameId}_${nodeId}`);

  if (typeof rawState !== 'string') {
    if (defaultState !== null && defaultState !== undefined) {
      await saveNodeState(gameId, nodeId, defaultState);

      return defaultState;
    }

    return {};
  }

  return JSON.parse(rawState);
};

export const getGlobalState = async (gameId: UUID): Promise<NodeState> => {
  const rawState = await redisClient.HGET('state', `${gameId}_global`);

  if (typeof rawState !== 'string') {
    throw new Error('Unable to find global state');
  }

  return JSON.parse(rawState);
};

export const saveNodeState = async (
  gameId: UUID,
  nodeId: UUID,
  state: NodeState
): Promise<boolean> => {
  await redisClient.HSET('state', `${gameId}_${nodeId}`, JSON.stringify(state));

  return true;
};

export const saveGlobalState = async (
  gameId: UUID,
  state: NodeState
): Promise<boolean> => {
  await redisClient.HSET('state', `${gameId}_global`, JSON.stringify(state));

  return true;
};

export const setPreviousNode = async (
  gameId: UUID,
  playerId: UUID,
  nodeId: UUID): Promise<boolean> => {
  await redisClient.HSET('previous_node', `${gameId}_${playerId}`, nodeId);

  return true;
}

export const retrievePreviousNode = async (gameId: UUID, playerId: UUID): Promise<UUID | undefined> => {
  const rawState = await redisClient.HGET('previous_node', `${gameId}_${playerId}`);

  // cleanup
  await redisClient.HDEL('previous_node', `${gameId}_${playerId}`);

  return rawState;
}

export const updateState = async (
  gameId: UUID,
  node: Node,
  currentScenario: NodeScenario,
  givenAnswer?: Answers
): Promise<void> => {
  const state = await getNodeState(gameId, node.id, node.state);
  const setStates = [
    ...node.content,
    { type: 'set-state', content: currentScenario.setStates },
  ].filter((c) => c.type === 'set-state');

  if (node.type === 'Conversation' && givenAnswer !== undefined) {
    if (givenAnswer.action.action === INTERNAL_EXIT_CONVERSATION) {
      state[INTERNAL_CURRENT_TOPIC] = null;
    } else if (givenAnswer.action.action === INTERNAL_CONTINUE_CONVERSATION) {
      state[INTERNAL_CURRENT_TOPIC] = null;
    } else {
      state[INTERNAL_CURRENT_TOPIC] = givenAnswer.action;
    }

    await saveNodeState(gameId, node.id, state);
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
        nodeId !== undefined
          ? await getNodeState(gameId, nodeId)
          : await getNodeState(gameId, node.id);

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

      await saveNodeState(gameId, nodeId ?? node.id, nodeState);
    }
  }
};
