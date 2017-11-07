const Project = require('../models/Project');
const BaseViewSet = require('./BaseViewSet');
const ValidationError = require('../errors/ValidationError');
const validate = require('../utils/validate');
const {requireAuthentication} = require('../authentication/jwt/middleware');
const {requirePermission} = require('../authorization/middleware');

class ProjectViewSet extends BaseViewSet {

  constructor(options) {
    super(Project, options);
    const id = this.getIdRouteParameter();
    this.updateMember = this.updateMember.bind(this);
    this.router.post(`:${id}(\\d+)/update-member`, requirePermission(`${this.Model.tableName}:update`), this.updateMember);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx) {
    // We only list projects where the authenticated user is the project owner
    // OR where they are a member.
    const {user} = ctx.state;
    return Project
      .query()
      .distinct('project.*')
      .eager('user')
      .leftJoinRelation('members')
      .where('project.userId', user.id)
      .orWhere(function () {
        this.where({
          'members.id': user.id,
          'members_join.membershipIsActive': true
        });
      });
  }

  getRetrieveQueryBuilder(ctx) {
    return Project
      .query()
      .eager('[user, members]');
  }

  getCreateQueryBuilder(ctx) {
    return Project
      .query()
      .eager('[user, members]');
  }

  getUpdateQueryBuilder(ctx) {
    return Project
      .query()
      .eager('[user, members]');
  }

  async create(ctx, next) {
    ctx.request.body.userId = ctx.state.user.id;
    delete ctx.request.body.user;
    delete ctx.request.body.members;
    return super.create(ctx, next);
  }

  async update(ctx, next) {
    delete ctx.request.body.user;
    delete ctx.request.body.members;
    return super.update(ctx, next);
  }

  async updateMember(ctx, next) {
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
    await project.updateUserMembership(userId, {membershipIsActive, membershipType});
    ctx.body = await project.getUserById(userId);
  }

}

module.exports = ProjectViewSet;
