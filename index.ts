import refect, { refectLocal as reactRefectLocal } from 'react-refect';

interface Store {
  dispatch: (action: any) => any
  getState: () => any
  subscribe: any
}

export class BaseEffect<Actions> {
  protected getActions?: () => Actions
  protected getStore?: () => Store
  protected namespace?: string
}

interface Get<State> {
  /**
   * 获取整个组件的数据
   */
  () : State

  /**
   * 获取当前组件的数据。
   * 
   * @param path 数据路径，支持数组，如：a.b、2.1、a.1
   * 
   * @returns 返回对应路径的数据，不存在则返回 undefined
   */
  (path: string | number) : any
}

export class BaseTasks<Actions, State, Effects> {
  protected actions: Actions
  protected effects: Effects

  /**
   * 监听一个 action
   * 
   * @param pattern 可以是数组、字符串、函数、action、可以引用深层级，如 watch('counter.changeNum')
   * 
   * @param callback 监听回调。参数为 rest 加上被监听 action 的参数
   * 
   */
  protected watch: (pattern: any, callback: any, ...rest: any[]) => any

  /**
   * 获取当前组件的数据。当没有参数时，获取整个组件的数据。
   * 
   * @param path 数据路径，支持数组，如：a.b、2.1、a.1
   * 
   * @returns 返回对应路径的数据，不存在则返回 undefined
   */
  protected get: Get<State>
}

export class BaseReducer<State> {
  protected state: State
}

interface Options {
  Reducer?: ({ new(): BaseReducer<any> })
  Tasks?: ({ new(): BaseTasks<any, any, any> })
  State?: ({ new(): any })
  Effects?: BaseEffect<any>[]
  defaultNamespace: string
  View: any
}

function getActions(inst: any, bindings: any, filters: string[] = [], bindSelf = false) {
  const methods = Object.getPrototypeOf(inst);
  const methodNames = Object.getOwnPropertyNames(methods);
  const finalFilters = [...filters, 'constructor'];

  const actionMap = methodNames
    .filter(str => finalFilters.indexOf(str) < 0)
    .reduce((result: any, methodName) => {
      return {
        ...result,
        [methodName]: methods[methodName].bind(bindings),
      };
    }, {});

  if (bindSelf) {
    Object.keys(actionMap).forEach((methodName) => {
      bindings[methodName] = actionMap[methodName];
    });
  }

  return actionMap;
}

function parseReducer(Reducer: any) {
  return Reducer ? (state: any, manager: any) => {
    return getActions(new Reducer(), { state }, ['state']);
  } : undefined;
}

function parseEffect(Effect: any) {
  return (ctx: any) => {
    return getActions(new Effect(), ctx, ['putinReducer']);
  }
}

function parseOptions(options: Options) {
  const { Reducer, Tasks, State, Effects = [], defaultNamespace, View } = options;

  const reducer = parseReducer(Reducer);

  const tasks = Tasks ? (actions: any, effects: any, coreEffects : any = {}, plugins: any = {}) => {
    const filters = Object.keys(coreEffects).concat(['plugins', 'actions']);

    return getActions(new Tasks(), { ...coreEffects, actions, effects: plugins }, filters, true);
  } : undefined;

  const effects = Effects.map((Effect: { new(): any }) => {
    const plugin = new Effect();
    const PutinReducer = plugin.putinReducer;

    return {
      putinReducer: parseReducer(PutinReducer),
      plugin: parseEffect(Effect),
    };
  }, {});

  return {
    reducer,
    tasks,
    defaultNamespace,
    initialState: new State(),
    effects,
    view: View,
  };
}

export default function refectNext(options: Options) {
  const parsedOptions = parseOptions(options);

  return refect(parsedOptions);
} 

export function refectLocal(options: Options) {
  const parsedOptions = parseOptions(options);

  return reactRefectLocal(parsedOptions);
}
