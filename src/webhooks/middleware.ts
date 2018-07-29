import axios from 'axios';
import * as Koa from 'koa';
import { get, pick } from 'lodash';
import Project from '../models/Project';

interface IWebHookEventPayload {
  dateTime: Date;
  action: string;
  model: string;
  project: object;
  webHook: object;
  target: Array<{id: number}>;
}

const actionToEventMap: {[index: string]: string} = {
  bulkDelete: 'DeletedBulk',
  create: 'Created',
  delete: 'Deleted',
  update: 'Updated'
};

const actions = Object.keys(actionToEventMap);

export default async function (ctx: Koa.Context, next: () => Promise<any>) {
  // Immediately pass control to the next middleware. We invoke web hooks
  // asynchronously after all other middleware.
  await next();
  const { project, viewsetResult } = ctx.state as { project: Project, viewsetResult: any };
  if (!viewsetResult || !project) return;
  const { modelClass, action, data } = viewsetResult;
  if (!actions.includes(action)) return;
  const webHooks = await project.getActiveWebHooks();
  for (const webHook of webHooks) {
    const event = `${modelClass.tableName}${actionToEventMap[action]}`;
    if (!get(webHook, event)) continue;
    // For bulkDelete action data is an array of the deleted record ids
    const payload: IWebHookEventPayload = {
      action,
      dateTime: new Date(),
      model: modelClass.tableName,
      project: pick(project, ['id', 'name']) as any,
      target: actionToEventMap[action] === 'DeletedBulk' ? data : [pick(data, 'id')],
      webHook: pick(webHook, ['id', 'name', 'url']) as any
    };
    // We intentionally don't use await here as we don't
    // want to block the downstream middleware from returning
    // the response.
    axios
      .post(webHook.url, payload)
      .catch(err => {
        console.error(err);
      });
  }
}
