import refect, { BaseReducer, BaseTasks, refectLocal } from '../../';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

class State {
  num = 32
  size = 3
}

class Reducer extends BaseReducer<State> {
  addNum() {
    return {
      ...this.state,
      num: this.state.num + 1,
    };
  }
}

class Tasks extends BaseTasks<Tasks & Reducer, State, any> {
  addNumIfOdd() {
    if (this.get().num % 2) {
      this.actions.addNum();
    }
  }
}

class Props extends State {
  actions?: Reducer & Tasks
}

class View extends React.Component<Props, any> {
  render() {
    const { num, actions, size } = this.props;

    return (
      <div>
        <button onClick={actions.addNum}>
          add number
        </button>
        <button onClick={actions.addNumIfOdd}>
          add number if odd
        </button>
        num: {num}
      </div>
    );
  }
}

const Picker = refectLocal({
  Reducer,
  Tasks,
  State,
  defaultNamespace: 'picker',
  View,
});

ReactDOM.render(<Picker />, document.getElementById('app'));
