import * as Koa from 'koa';
import Project from '../models/Project';
import axios from 'axios';
import {get, pick} from 'lodash';

interface IWebHookEventPayload {
  dateTime: Date;
  action: string;
  model: string;
  project: object;
  webHook: object;
  target: number[];
}

const actionToEventMap: {[index:string]: string} = {
  'update': 'Updated',
  'create': 'Created',
  'delete': 'Deleted',
  'bulkDelete': 'DeletedBulk'
};

const actions = Object.keys(actionToEventMap);

export default async function (ctx: Koa.Context, next: Function) {
  // Immediately pass control to the next middleware. We invoke web hooks
  // asynchronously after all other middleware.
  await next();
  const {project, viewsetResult} = ctx.state as {project: Project, viewsetResult: any};
  if (!viewsetResult || !project) return;
  const {modelClass, action, data} = viewsetResult;
  if (!actions.includes(action)) return;
  const webHooks = await project.getActiveWebHooks();
  for (const webHook of webHooks) {
    const event = `${modelClass.tableName}${actionToEventMap[action]}`;
    if (!get(webHook, event)) continue;
    // For bulkDelete action data is an array of the deleted record ids
    const payload: IWebHookEventPayload = {
      dateTime: new Date(),
      action: action,
      model: modelClass.tableName,
      project: pick(project, ['id', 'name']) as any,
      webHook: pick(webHook, ['id', 'name', 'url']) as any,
      target: actionToEventMap[action] === 'DeletedBulk' ? data : [pick(data, 'id')]
    };
    try {
      await axios.post(webHook.url, payload);
    } catch (err) {
      // TODO: Log error
    }
  };
};
