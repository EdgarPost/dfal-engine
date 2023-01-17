import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import path from 'path';
import { GraphQLJSON } from 'graphql-type-json';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import { getFileByName } from './play';
import { getMarkdownFiles } from './utils/getMarkdownFiles';
import { fileToNode } from './utils/markdownToNode';
import {
  getNodeState,
  INTERNAL_EXIT_CONVERSATION,
  retrievePreviousNode,
  setPreviousNode,
  updateState,
} from './utils/updateState';
import { getScenario } from './utils/getScenario';
import { Node, NodeScenario, NodeState } from './types';

const DFAL_MD_ROOT_DIR = process.env.DFAL_MD_ROOT_DIR as string;

console.log(DFAL_MD_ROOT_DIR);

export const redisClient = createClient({
  url: 'redis://localhost:6379',
});

const createPlayerDimension = async (playerId: number): Promise<void> => {
  console.log('dimension for', playerId, 'created');

  // for (const node of nodes) {
  //   await fileToNode(node);
  // }

  // const rootNodeFile = getFileByName(nodes, 'Yellow Fields - Ledina');

  // if (rootNodeFile === undefined) {
  //   throw new Error('Root node not found!');
  // }

  // const rootNode = await fileToNode(rootNodeFile);

  // let currentNode = rootNode;

  // while (currentNode !== null) {
  //   const nextNode = await drawCard(currentNode, nodes);

  //   if (nextNode === null) {
  //     break;
  //   }

  //   currentNode = nextNode;
  //   console.log(getState(currentNode));
  // }
};

const typeDefs = `#graphql
  scalar JSON

  type User {
    id: ID!
    name: String!
  }

  type GameConfig {
    dimensions: [Dimension]!
  }

  type Dimension {
    id: String!
    name: String!
  }

  type GameSession {
    id: ID!
    players: [Player]
    card: Card
  }

  type Player {
    id: ID!
  }

  type CardAction { 
     label: String
     action: String
  }

  type Card { 
    actions: [CardAction]
  }

  type Query {
    config: GameConfig!
    games: [GameSession]!
    game(id: ID!): GameSession
    me: User
  }

  type CardAction {
    nextNode: ID!
  }

  type Mutation { 
    createGame: GameSession!
    login: String!
    joinGame(id: ID!, dimension:ID!): GameSession
    leaveGame(id: ID!): Boolean
    card(gameId: ID!, action: String): Card
  }

  type Node {
    id: ID!
    state: JSON!
  }

  union CardType = Scenario | Conversation

  interface Card {
    node: Node!
  }

  type CardAction {
    label: String!
  }

  type Scenario implements Card {
    node: Node!
    title: String!
    text: [String]!
    actions: [CardAction!]!
  }

  type Conversation implements Card {
    node: Node!
    title: String!
    text: [String]!
    with: Character!
    actions: [CardAction!]!
  }

  type Character {
    name: String!
  }
`;

export interface Player {
  userId: UUID;
  id: UUID;
  dimension?: Dimension;
  currentNode?: string;
}

export interface GameSession {
  id: UUID;
  players: Player[];
}

export interface DimensionConfig {
  rootNode: string;
  name: string;
  id: Dimension;
}

export interface GameConfig {
  dimensions: DimensionConfig[];
}

export type UUID = string;
export type Dimension = 'ledina';

const gameConfig: GameConfig = {
  dimensions: [
    {
      id: 'ledina',
      rootNode: 'Yellow Fields - Ledina',
      name: 'Ledina',
    },
  ],
};

// hard-coded for now
const userId: UUID = 'a8c736df-d7e3-4945-82e8-ba155cb10da8';

const createGameSession = async (): Promise<GameSession> => {
  const id = uuidv4();

  const session: GameSession = {
    id,
    players: [],
  };

  await redisClient.HSET('games', id, JSON.stringify(session));

  return session;
};

const getDimensionConfig = (id: Dimension): DimensionConfig =>
  gameConfig.dimensions.find(
    (dimension) => dimension.id === id
  ) as DimensionConfig;

const createPlayer = (): Player => {
  return {
    userId,
    id: uuidv4(),
  };
};

const getGameSessions = async (): Promise<readonly GameSession[]> => {
  const games = await redisClient.HGETALL('games');

  return Object.values(games).map((session) => JSON.parse(session));
};

const getGameSession = async (gameId: UUID): Promise<GameSession | null> => {
  const rawSession = await redisClient.HGET('games', gameId);

  if (rawSession === null || rawSession === undefined) {
    return null;
  }

  const gameSession: GameSession = JSON.parse(rawSession);

  return gameSession;
};

const saveGameSession = async (session: GameSession): Promise<GameSession> => {
  await redisClient.HSET('games', session.id, JSON.stringify(session));

  return session;
};

const isDimensionFree = (
  gameSession: GameSession,
  dimension: Dimension
): boolean =>
  gameSession.players.length === 0 ||
  !gameSession.players.some((player) => player.dimension === dimension);

const joinGame = (
  gameSession: GameSession,
  player: Player,
  dimension: Dimension
): boolean => {
  if (!isDimensionFree(gameSession, dimension)) {
    throw new Error(`Dimension ${dimension} already taken!`);
  }

  const dimensionConfig = getDimensionConfig(dimension);

  gameSession.players.push({
    ...player,
    dimension,
    currentNode: dimensionConfig.rootNode,
  });

  return true;
};

const configResolver = (): GameConfig => gameConfig;
const gameSessionsResolver = async (): Promise<readonly GameSession[]> =>
  await getGameSessions();

const loginResolver = (): UUID => userId;
const createGameSessionResolver = async (): Promise<GameSession> =>
  await createGameSession();

interface JoinGameResolverArguments {
  id: UUID;
  dimension: Dimension;
}
const joinGameResolver = async (
  _parent: any,
  { id, dimension }: JoinGameResolverArguments
): Promise<GameSession> => {
  const gameSession = await getGameSession(id);

  if (gameSession === null) {
    throw new Error(`No session with game id ${id}`);
  }

  if (gameSession.players.length >= gameConfig.dimensions.length) {
    throw new Error('Max number of players reached');
  }

  const player = createPlayer();
  joinGame(gameSession, player, dimension);

  await saveGameSession(gameSession);

  return gameSession;
};

let nodes: string[] = [];
const getAvailableNodes = async (): Promise<string[]> => {
  if (nodes.length > 0) {
    return nodes;
  }

  nodes = await getMarkdownFiles(path.resolve(DFAL_MD_ROOT_DIR, '**/*.md'));

  return nodes;
};

interface CardNode {
  state: Record<string, unknown>;
}

interface CardAction {
  label: string;
  action: string;
}

interface CardResolverReturnType {
  __typename: 'Scenario' | 'Conversation';
  title: string;
  text: readonly string[];
  actions: readonly CardAction[];
  node: CardNode;
}

interface UserNode {
  node: Node;
  currentScenario: NodeScenario;
  nodeState: NodeState;
}

const getNodeForUser = async (
  gameId: UUID,
  userId: UUID
): Promise<UserNode | null> => {
  const gameSession = await getGameSession(gameId);

  if (gameSession === null) {
    throw new Error(`No session with game id ${gameId}`);
  }

  const player = gameSession.players.find((player) => player.userId === userId);

  if (player === undefined) {
    throw new Error(`You are not part of this game`);
  }

  if (typeof player.currentNode !== 'string') {
    return null;
  }

  const availableNodes = await getAvailableNodes();

  const nodeFilename = getFileByName(availableNodes, player.currentNode);

  if (typeof nodeFilename !== 'string') {
    throw new Error(`Unable to find file by name ${player.currentNode}`);
  }

  const node = await fileToNode(nodeFilename);

  const currentScenario = await getScenario(node, gameId);

  if (currentScenario === null || currentScenario === undefined) {
    throw new Error('No active scenario for this node');
  }

  const nodeState = await getNodeState(gameId, node.id);

  return {
    node,
    currentScenario,
    nodeState,
  };
};

// const cardResolver = async (
//   _parent: any,
//   { gameId }: CardResolverArguments
// ): Promise<CardResolverReturnType | null> => {
//   const nodeForUser = await getNodeForUser(gameId, userId);

//   if (nodeForUser === null) {
//     return null;
//   }

//   const { node, nodeState, currentScenario } = nodeForUser;

//   return {
//     __typename: 'Scenario',
//     title: currentScenario.title,
//     text: currentScenario.text,
//     actions: currentScenario.actions.map(({ text, action }) => ({
//       label: text,
//       action,
//     })),
//     node: {
//       state: nodeState,
//     },
//   };
// };

const meResolver = () => ({ id: userId, name: 'Edgar' });

interface CardActionResolverArguments {
  gameId: UUID;
  action?: string;
}

const cardActionResolver = async (
  _parent: any,
  { gameId, action }: CardActionResolverArguments
): Promise<CardResolverReturnType | null> => {
  const nodeForUser = await getNodeForUser(gameId, userId);

  if (nodeForUser === null) {
    return null;
  }

  if (action !== undefined) {
    const gameSession = await getGameSession(gameId);

    if (gameSession === null) {
      throw new Error('No such game session');
    }

    const { node, nodeState, currentScenario } = nodeForUser;
    const availableNodes = await getAvailableNodes();

    await updateState(gameId, node, currentScenario);

    const player = gameSession.players.find(
      (p) => p.userId === userId
    ) as Player;

    if (node.type === 'Conversation') {
      if (action === INTERNAL_EXIT_CONVERSATION) {
        const previousNodeId = await retrievePreviousNode(gameId, userId);
        if (previousNodeId === undefined) {
          throw new Error('No previousNode!');
        }

        player.currentNode = previousNodeId;

        await saveGameSession(gameSession);

        const nodeForUser = await getNodeForUser(gameId, userId);

        if (nodeForUser === null) {
          throw new Error('No node for user found');
        }

        const { nodeState, currentScenario } = nodeForUser;

        return {
          __typename: 'Scenario',
          title: currentScenario.title,
          text: currentScenario.text,
          actions: currentScenario.actions.map(({ text, action }) => ({
            label: text,
            action,
          })),
          node: {
            state: nodeState,
          },
        };
      }

      // Still in the same conversation
      return {
        __typename: 'Conversation',
        title: currentScenario.title,
        text: currentScenario.text,
        actions: currentScenario.actions.map(({ text, action }) => ({
          label: text,
          action,
        })),
        node: {
          state: nodeState,
        },
      };
    }

    if (node.type === 'Card') {
      const nextFile = getFileByName(availableNodes, action);

      if (nextFile !== undefined) {
        const nextNode = await fileToNode(nextFile);

        if (['Card', 'Conversation'].includes(nextNode.type)) {
          await setPreviousNode(gameId, userId, node.id);

          player.currentNode = action;

          await saveGameSession(gameSession);

          const nodeForUser = await getNodeForUser(gameId, userId);

          if (nodeForUser === null) {
            throw new Error('No node for user found');
          }

          const { nodeState, currentScenario } = nodeForUser;

          return {
            __typename: 'Scenario',
            title: currentScenario.title,
            text: currentScenario.text,
            actions: currentScenario.actions.map(({ text, action }) => ({
              label: text,
              action,
            })),
            node: {
              state: nodeState,
            },
          };
        }
      }
    }
  }

  return nodeToCard(nodeForUser);
};

const nodeToCard = (node: UserNode): CardResolverReturnType => {
  const { nodeState, currentScenario } = node;

  return {
    __typename: 'Scenario',
    title: currentScenario.title,
    text: currentScenario.text,
    actions: currentScenario.actions.map(({ text, action }) => ({
      label: text,
      action,
    })),
    node: {
      state: nodeState,
    },
  };
}

interface GameSessionResolverArguments {
  id: UUID;
}

const gameSessionResolver = async (
  _parent: any,
  { id }: GameSessionResolverArguments
): Promise<GameSession | null> => {
  const gameSession = await getGameSession(id);

  if (gameSession === null) {
    throw new Error(`No session with game id ${id}`);
  }

  return gameSession;
}

const cardResolver = async (parent: any): Promise<CardResolverReturnType | null> => {
  console.log(parent);
  const { id: gameId } = parent;
  console.log(gameId, userId);
  const nodeForUser = await getNodeForUser(gameId, userId);

  if (nodeForUser === null) {
    return null;
  }

  return nodeToCard(nodeForUser);
}

const resolvers = {
  Query: {
    config: configResolver,
    games: gameSessionsResolver,
    game: gameSessionResolver,
    me: meResolver,
  },
  GameSession: {
    card: cardResolver,
  },
  Mutation: {
    login: loginResolver,
    createGame: createGameSessionResolver,
    joinGame: joinGameResolver,
    card: cardActionResolver,
  },
  Node: {
    state: GraphQLJSON,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
  await redisClient.connect();
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);
})();
