import refect, { BaseReducer, BaseTasks, BaseEffect } from '../../';
import * as React from 'react';
import { refectRoot } from 'react-refect';
import * as ReactDOM from 'react-dom';

class FetchEffectReducer extends BaseReducer<any> {
  onFetchPending(field?: string, url?: string, options?: any) {
    return {
      ...this.state,
      [field]: {
        ...(this.state[field] || {}),
        isLoading: true,
        hasError: false,
      },
    };
  }
  onFetchFulfilled(field?: string, data?: any, url?: string, options?: any) {
    return {
      ...this.state,
      [field]: {
        ...(this.state[field] || {}),
        isLoading: false,
        hasError: false,
        data,
      },
    };
  }
  onFetchRejected(field?: string, err?: any, url?: string, options?: any) {
    return {
      ...this.state,
      [field]: {
        ...(this.state[field] || {}),
        isLoading: false,
        hasError: true,
        message: err.message,
      },
    };
  }
}

class FetchEffect extends BaseEffect<FetchEffectReducer> {
  protected putinReducer = FetchEffectReducer

  fetch(url: string, options: any, field: string, meta: any) {
    const actions = this.getActions();
    const dispatch = this.getStore().dispatch;

    dispatch(actions.onFetchPending(field, url, options));

    return new Promise<any>((resolve, reject) => {
      fetch(url, options)
        .then(res => res.json())
        .then((data: any) => {
          if (data && data.message) {
            dispatch(actions.onFetchRejected(field, data.message, url, options));
            reject(data.message);
          } else {
            dispatch(actions.onFetchFulfilled(field, data, url, options));
            resolve(data);
          }
        }, err => {
          dispatch(actions.onFetchRejected(field, err, url, options));
          reject(err);
        });
    });
  }
}

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

const Picker = refect({
  Reducer,
  Tasks,
  State,
  defaultNamespace: 'picker',
  View,
  Effects: [FetchEffect]
});

const Root = refectRoot();

ReactDOM.render(
  <Root>
    <Picker title="搜索啊搜索" />
  </Root>, document.getElementById('app'));
