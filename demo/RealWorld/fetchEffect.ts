import { BaseReducer, BaseEffect } from '../../index.ts';

export class FetchEffectReducer extends BaseReducer<any> {
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

export default class FetchEffect extends BaseEffect<FetchEffectReducer> {
  protected putinReducer = FetchEffectReducer

  fetch(url: string, options: any, field: string, meta: any) {
    const actions = this.getActions();
    const dispatch = this.getStore().dispatch;

    dispatch(actions.onFetchPending(field, url, options));

    return new Promise((resolve, reject) => {
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
