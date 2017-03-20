import refect, { BaseReducer, BaseTasks, refectLocal } from '../../index.ts';
import FetchEffect, { FetchEffectReducer } from './fetchEffect.ts';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

class State {
  user = {
    data: {} as any,
    isLoading: false,
    hasError: false,
  }
  userId = ''
}

class Reducer extends BaseReducer<State> {
  changeUserId(userId: string) {
    return {
      ...this.state,
      userId,
    };
  }
}

class Tasks extends BaseTasks<Tasks & Reducer, State, FetchEffect> {
  async changeUserId(userId: string) {
    const url = `https://api.github.com/users/${userId}/followers`;
    return this.effects.fetch(url, {}, 'user', { userId });
  }
  async mount() {
    const initData = await this.changeUserId('jasonHzq');
    console.log(initData);
  }
}

class Props extends State {
  actions?: Reducer & Tasks
  title: string
}

function fmtE(fn: any) {
  return function (e: any) {
    return fn(e.target.value);
  };
}

class View extends React.Component<Props, any> {
  render() {
    const { actions, user, title, userId } = this.props;
    const { data, isLoading, hasError } = user;

    return (
      <div>
        <h1>{title}</h1>
        <input
          value={userId}
          onChange={fmtE(actions.changeUserId)}
          placeholder="请输入 Github ID，如 camsong"
        />
        <div className="message">
          {isLoading && <div className="spinner"></div>}
          {hasError && <p className="error"> 接口受限，歇会重试 :( </p>}
        </div>
        <ul>
          {Array.isArray(data) && data.map(follower => {
            const { id, avatar_url: avatarUrl, html_url: htmlUrl, login } = follower;

            return (
              <li key={id}>
                <a href={htmlUrl} target="_blank">
                  <img alt="avatar" src={avatarUrl} style={{ width: 100, height: 100 }}></img>
                  <p className="userId" title={login}>{login}</p>
                </a>
              </li>
            );
          })}
        </ul>
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
  Effects: [FetchEffect],
});

ReactDOM.render(<Picker title="搜索啊搜索" />, document.getElementById('app'));
