import { marked } from 'marked';
import type {
  NodeContents,
  NodeItem,
  NodeScenario,
  NodeType,
  ScenarioAction,
} from '../../types';
import { conditionOperators, toCondition } from '../toCondition';
import { expressionOperators, toExpression } from '../toExpression';
import {
  INTERNAL_CONTINUE_CONVERSATION,
  INTERNAL_EXIT_CONVERSATION,
} from '../updateState';

export const tokensToCardNode = (
  tokens: marked.TokensList,
  type: NodeType
): NodeContents => {
  const content: NodeContents = [];

  let currentScenario: NodeItem | undefined;
  const rootActions: ScenarioAction[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        if (token.depth === 1) {
          content.push({
            type: 'title',
            content: token.text,
          });

          if (type === 'Conversation') {
            const rootScenarioContents: NodeScenario = {
              title: 'Root',
              text: ['Root text'],
              actions: rootActions,
              conditions: [],
              setStates: [],
            };

            content.push({
              type: 'scenario',
              content: rootScenarioContents,
            });
          }
        }

        if (token.depth === 2) {
          if (currentScenario != null) {
            content.push(currentScenario);
          }

          if (type === 'Conversation') {
            rootActions.push({
              text: token.text,
              action: token.text,
            });
          }

          currentScenario = {
            type: 'scenario',
            content: {
              title: token.text,
              text: [],
              actions: [
                {
                  text: 'Continue',
                  action: INTERNAL_CONTINUE_CONVERSATION,
                },
              ],
              conditions: [],
              setStates: [],
            },
          };
        }
        break;

      /**
       * Ordered lists act as an action list. Action lists have a key and a value, separated
       * by a : sign. The key is the value the user sees on the screen. The value can be:
       * - link to another node, using the Obsidian default syntax [[AnotherNode]]
       * - ...?
       */
      case 'list': {
        if (token.ordered) {
          if (currentScenario != null) {
            (currentScenario.content as NodeScenario).actions = token.items.map(
              (item) => {
                let [text, action] = item.text.split(':').map((s) => s.trim());

                if (action !== undefined) {
                  switch (true) {
                    // Link to another node
                    case action.startsWith('[['):
                      action = action.replace('[[', '').replace(']]', '');
                      break;
                    default:
                      // no action
                      break;
                  }
                }

                return {
                  text,
                  action,
                };
              }
            );
          }
        }

        if (!token.ordered) {
          if (currentScenario != null) {
            (currentScenario.content as NodeScenario).text = token.items.map(
              (item) => {
                return item.text;
              }
            );
          }
        }
        break;
      }

      case 'code':
        if (token.lang === 'condition') {
          if (currentScenario != null) {
            const conditions = token.text.split('\n');

            (currentScenario.content as NodeScenario).conditions =
              conditions.map((rawCondition) => {
                for (const operator of conditionOperators) {
                  const condition = toCondition(rawCondition, operator);

                  if (condition != null) {
                    return condition;
                  }
                }

                throw new Error(`Invalid condition: ${rawCondition}`);
              });
          }
        }

        if (token.lang === 'set-state') {
          const setStates = token.text.split('\n').map((rawSetState) => {
            let [variable, value] = rawSetState.split('=');

            variable = variable.trim();
            value = value.trim();

            for (const expressionOperator of expressionOperators) {
              const expression = toExpression(value, expressionOperator);

              if (expression != null) {
                return {
                  variable,
                  expression,
                };
              }
            }

            return {
              variable,
              expression: {
                left: value,
              },
            };
          });

          if (currentScenario != null) {
            (currentScenario.content as NodeScenario).setStates = setStates;
          } else {
            content.push({
              type: 'set-state',
              content: setStates,
            });
          }
        }
        break;

      case 'paragraph':
        if (currentScenario != null) {
          (currentScenario.content as NodeScenario).text.push(token.text);
        }
        break;

      case 'space':
      case 'hr':
        break;

      default:
        console.log(token);
        break;
    }
  }

  if (currentScenario != null) {
    if (type === 'Conversation') {
      rootActions.push({
        text: 'Back',
        action: INTERNAL_EXIT_CONVERSATION,
      });
    }
    content.push(currentScenario);
  }

  return content;
};
