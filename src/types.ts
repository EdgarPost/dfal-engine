export type NodeType =
  | 'Card'
  | 'Conversation'
  | 'Location'
  | 'Character'
  | 'Story'
  | 'StoryElement';

export type NodeId = string;

export interface ScenarioAction {
  text: string;
  action: string;
}

export type ConditionOperator = '=' | '>' | '<' | '>=' | '<=';
export type ExpressionOperator = '+' | '-' | '*' | '/';

export interface Condition {
  left: string | number;
  operator: ConditionOperator;
  right: string | number | boolean;
}

export interface Expression {
  left: string | number;
  operator?: ExpressionOperator;
  right?: string | number;
}

export interface SetState {
  variable: string;
  expression: Expression;
}

export interface NodeScenario {
  title: string;
  text: string[];
  actions: ScenarioAction[];
  conditions: Condition[];
  setStates: SetState[];
}

export type NodeState = Record<string, unknown>;

export interface Node {
  id: NodeId | undefined;
  type: NodeType;
  state: NodeState;
  content: NodeContents;
}

export type NodeSetState = SetState[];

export type NodeText = string;
export type NodeTitle = string;
export interface NodeItem {
  type: 'title' | 'scenario' | 'set-state';
  content: NodeText | NodeTitle | NodeScenario | NodeSetState;
}
export type NodeContents = NodeItem[];
