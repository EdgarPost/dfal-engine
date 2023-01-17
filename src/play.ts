import inquirer, { Answers } from 'inquirer';
import path from 'path';
import { Node, NodeScenario } from './types';
import { getMarkdownFiles } from './utils/getMarkdownFiles';
import {
  getScenario,
  getScenarioByTitle,
  includeScenario,
} from './utils/getScenario';
import { fileToNode } from './utils/markdownToNode';
import {
  // getState,
  INTERNAL_EXIT_CONVERSATION,
  updateState,
} from './utils/updateState';

// const renderCard = async (node: Node): Promise<Answers> => {
//   const currentScenario = getScenario(node);
//
//   if (currentScenario === undefined) {
//     throw new Error('No scenario??');
//   }
//
//   console.clear();
//
//   const answers = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'action',
//       prefix: '',
//       message: `${currentScenario?.text.join(
//         '\n\n'
//       )}\n\n--------------------------\n`,
//       choices: currentScenario?.actions
//         .filter((action) => {
//           if (node.type === 'Conversation') {
//             const correspondingScenario = getScenarioByTitle(node, action.text);
//
//             if (correspondingScenario !== undefined) {
//               return includeScenario(
//                 correspondingScenario.content as NodeScenario,
//                 node.state
//               );
//             }
//           }
//           return true;
//         })
//         .map((action) => ({
//           name: action.text,
//           value: action,
//         })),
//     },
//   ]);
//
//   // updateState(node, currentScenario, answers);
//
//   return answers;
// };

// let previousNode: Node | undefined;
// export const drawCard = async (
//   node: Node,
//   files: string[]
// ): Promise<Node | null> => {
//   const answers = await renderCard(node);
//
//   if (node.type === 'Conversation') {
//     if (answers.action.action === INTERNAL_EXIT_CONVERSATION) {
//       if (previousNode === undefined) {
//         throw new Error('No previousNode!');
//       }
//
//       return previousNode;
//     }
//
//     return node;
//   }
//
//   if (node.type === 'Card') {
//     const nextFile = getFileByName(files, answers.action.action);
//
//     if (nextFile !== undefined) {
//       const nextNode = await fileToNode(nextFile);
//
//       if (['Card', 'Conversation'].includes(nextNode.type)) {
//         previousNode = node;
//
//         return nextNode;
//       }
//
//       return null;
//     }
//   }
//
//   return null;
// };

export const getFileByName = (
  availableNodes: string[],
  name: string
): string | undefined => {
  return availableNodes.find((f) => {
    const parts = f.split('/');
    const filename = parts[parts.length - 1];

    return filename === `${name}.md`;
  });
};

// const main = async (): Promise<void> => {
//   const nodes = await getMarkdownFiles(
//     path.resolve(__dirname, '..', '**/*.md')
//   );
//
//   console.log('>>>>>', nodes);
//
//   for (const node of nodes) {
//     await fileToNode(node);
//   }
//
//   const rootNodeFile = getFileByName(nodes, 'Yellow Fields - Ledina');
//
//   if (rootNodeFile === undefined) {
//     throw new Error('Root node not found!');
//   }
//
//   const rootNode = await fileToNode(rootNodeFile);
//
//   let currentNode = rootNode;
//
//   while (currentNode !== null) {
//     const nextNode = await drawCard(currentNode, nodes);
//
//     if (nextNode === null) {
//       break;
//     }
//
//     currentNode = nextNode;
//     // console.log(getState(currentNode));
//   }
//
//   console.clear();
//   console.log('NO MORE CARDS --- END OF GAME');
// };

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function () {
  // await main();
})();
