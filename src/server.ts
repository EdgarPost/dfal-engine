import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import { drawCard, getFileByName } from './play';
import { getMarkdownFiles } from './utils/getMarkdownFiles';
import { fileToNode } from './utils/markdownToNode';
import { getState } from './utils/updateState';
import { getScenario } from './utils/getScenario';

const redisClient = createClient({
  url: 'redis://localhost:6380',
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
  }

  type Player {
    id: ID!
  }

  type CardAction { 
     label: String
  }

  type Card { 
    actions: [CardAction]
  }

  type Query {
    config: GameConfig!
    games: [GameSession]!
    card(gameId: ID!): CardType
  }

  type Mutation { 
    createGame: GameSession!
    login: String!
    joinGame(id: ID!, dimension:ID!): GameSession
    leaveGame(id: ID!): Boolean
    cardAction(gameId: ID!): String
  }

  union CardType = Scenario | Conversation

  type CardAction {
    label: String!
  }

  type Scenario {
    title: String!
    text: [String]!
    actions: [CardAction!]!
  }

  type Conversation {
    with: Character!
    actions: [CardAction!]!
  }

  type Character {
    name: String!
  }
`;

interface Player {
  userId: UUID;
  id: UUID;
  dimension?: Dimension;
  currentNode?: string;
}

interface GameSession {
  id: UUID;
  players: Player[];
}

interface DimensionConfig {
  rootNode: string;
  name: string;
  id: Dimension;
}

interface GameConfig {
  dimensions: DimensionConfig[];
}

type UUID = string;
type Dimension = 'ledina';

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

interface CardResolverArguments {
  gameId: UUID;
}

let nodes: string[] = [];
const getAvailableNodes = async (): Promise<string[]> => {
  if (nodes.length > 0) {
    return nodes;
  }

  nodes = await getMarkdownFiles(path.resolve(__dirname, '..', '**/*.md'));

  return nodes;
};

const cardResolver = async (
  _parent: any,
  { gameId }: CardResolverArguments
): Promise<any> => {
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

  const currentScenario = getScenario(node);
  console.log(currentScenario);

  return {
    __typename: 'Scenario',
    title: currentScenario?.title,
    text: currentScenario?.text,
    actions: currentScenario?.actions.map(({ text }) => ({ label: text })),
  };
};

const cardActionResolver = async () => {
  // get game session by game id
  // determine next card and return node name
  // fetch next card with query card()
  return 'ledina';
};

const resolvers = {
  Query: {
    config: configResolver,
    games: gameSessionsResolver,
    card: cardResolver,
  },
  Mutation: {
    login: loginResolver,
    createGame: createGameSessionResolver,
    joinGame: joinGameResolver,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function () {
  await redisClient.connect();
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);
})();
