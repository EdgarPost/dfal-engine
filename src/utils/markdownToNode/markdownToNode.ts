import { marked } from 'marked';
import matter from 'gray-matter';
import { Node, NodeContents, NodeId } from '../../types';
import { tokensToCardNode } from '../tokensToNode';
import { readFile } from '../readFile';
import { INTERNAL_CURRENT_TOPIC } from '../updateState';

const activeNodes = new Map<string, Node>();
export const idNodes = new Map<NodeId, Node>();

export const fileToNode = async (filePath: string): Promise<Node> => {
  if (activeNodes.has(filePath)) {
    return activeNodes.get(filePath) as Node;
  }

  const fileContents = await readFile(filePath);

  const node = markdownToNode(fileContents);
  activeNodes.set(filePath, node);

  if (node.id !== undefined) {
    if (idNodes.has(node.id)) {
      throw new Error(`Node with id ${node.id} already registed`);
    }

    idNodes.set(node.id, node);
  }

  return node;
};

export const markdownToNode = (markdown: string): Node => {
  const parts = markdown.split('---');
  const document = parts[parts.length - 1];

  const front = matter(markdown).data;
  const tokens = marked.lexer(document);

  const { type, id, ...state } = front;

  let content: NodeContents = [];

  content = tokensToCardNode(tokens, type);

  if (type === 'Conversation') {
    state[INTERNAL_CURRENT_TOPIC] = null;
  }

  return {
    id,
    type,
    state,
    content,
  };
};
