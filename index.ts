import refect from 'react-refect';

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
  (): State

  /**
   * 获取当前组件的数据。
   *
   * @param path 数据路径，支持数组，如：a.b、2.1、a.1
   *
   * @returns 返回对应路径的数据，不存在则返回 undefined
   */
  (path: string | number): any
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

  /**
   * 一般用来 dispatch redux-router action
   */
  protected dispatch: (action: any) => any

  /**
   * 用来 dispatch 自己的 action，如： put('child1.fetchData')
   */
  protected put: (pattern: string, ...rest: any[]) => any

  /**
   * dispatch 一个 task action，并返回 task 执行结果
   */
  protected done: (action: any, ...rest: any[]) => any
}

export class BaseReducer<State> {
  protected state: State
}

interface Options {
  Reducer?: ({ new(): BaseReducer<any> })
  Tasks?: ({ new(): BaseTasks<any, any, any> })
  State?: ({ new(): any })
  mapStateToProps?: (storeState?: any, props?: any, storeAllState?: any) => any;
  Effects?: any[]
  defaultNamespace: string
  defaultProps?: any
  View: any
}

function getActions(inst: any, bindings: any, filters: string[] = [], bindSelf = false) {
  const babelMethods: any = Object.keys(inst).reduce((res, methodName) => {
    return {
      ...res,
      [methodName]: inst[methodName],
    };
  }, {});
  const babelMethodNames = Object.keys(babelMethods);

  const methods: any = Object.getPrototypeOf(inst);
  const methodNames = Object.getOwnPropertyNames(methods).concat(babelMethodNames);
  const finalFilters = [...filters, 'constructor'];

  const actionMap = methodNames
    .filter(str => finalFilters.indexOf(str) < 0)
    .reduce((result: any, methodName) => {
      const method = methods[methodName] || babelMethods[methodName];

      return {
        ...result,
        [methodName]: method.bind(bindings),
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
  const { Reducer, Tasks, State, Effects = [], View } = options;

  const reducer = parseReducer(Reducer);

  const tasks = Tasks ? (actions: any, effects: any, coreEffects: any = {}, plugins: any = {}) => {
    const filters = Object.keys(coreEffects).concat(['plugins', 'actions']);

    return getActions(new Tasks(), { ...coreEffects, actions, effects: plugins }, filters, true);
  } : undefined;

  const effects = Effects.map((Effect: { new(): any }) => {
    const effector = new Effect();
    const PutinReducer = effector.putinReducer;

    return {
      putinReducer: parseReducer(PutinReducer),
      effector: parseEffect(Effect),
    };
  }, {});

  return {
    ...options,
    reducer,
    tasks,
    initialState: new State(),
    effects,
    view: View,
  };
}

export default function refectNext<T = {}>(options: Options) {
  const parsedOptions = parseOptions(options);

  return refect<T>(parsedOptions);
}
