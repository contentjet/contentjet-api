import * as Koa from 'koa';
import Project from '../models/Project';
import BaseViewSet from './BaseViewSet';
import ValidationError from '../errors/ValidationError';
import validate from '../utils/validate';
import {requireAuthentication} from '../authentication/jwt/middleware';
import {requirePermission} from '../authorization/middleware';

export default class ProjectViewSet extends BaseViewSet<Project> {

  constructor(options: any) {
    super(Project, options);
    const id = this.getIdRouteParameter();
    this.updateMember = this.updateMember.bind(this);
    this.router.post(`:${id}(\\d+)/update-member`, requirePermission(`${this.Model.tableName}:update`), this.updateMember);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx: Koa.Context) {
    // We only list projects where the authenticated user is the project owner
    // OR where they are a member.
    const {user} = ctx.state;
    return Project
      .query()
      .distinct('project.*')
      .eager('user')
      .leftJoinRelation('members')
      .where('project.userId', user.id)
      .orWhere(function (this: any) {
        this.where({
          'members.id': user.id,
          'members_join.membershipIsActive': true
        });
      }) as any;
  }

  getRetrieveQueryBuilder() {
    return Project
      .query()
      .eager('[user, members]');
  }

  getCreateQueryBuilder() {
    return Project
      .query()
      .eager('[user, members]');
  }

  getUpdateQueryBuilder() {
    return Project
      .query()
      .eager('[user, members]');
  }

  async create(ctx: Koa.Context) {
    ctx.request.body.userId = ctx.state.user.id;
    delete ctx.request.body.user;
    delete ctx.request.body.members;
    return super.create(ctx);
  }

  async update(ctx: Koa.Context) {
    delete ctx.request.body.user;
    delete ctx.request.body.members;
    return super.update(ctx);
  }

  async updateMember(ctx: Koa.Context) {
    const {project} = ctx.state;
    try {
      await validate.async(
        ctx.request.body,
        {
          userId: {
            presence: true,
            projectMember: {
              project
            }
          },
          membershipIsActive: {
            boolean: true
          },
          membershipType: {
            inclusion: ['author', 'admin']
          }
        }
      );
    } catch (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {userId, membershipIsActive, membershipType} = ctx.request.body;
    await project.updateUserMembership(userId, membershipIsActive, membershipType);
    ctx.body = await project.getUserById(userId);
  }

}
