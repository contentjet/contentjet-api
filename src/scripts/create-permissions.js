const app = require('../app');


const actions = ['create', 'update', 'list', 'retrieve', 'delete'];

const models = Object.values(app.models);

async function createPermissions() {
  for (let Model of models) {
    for (let action of actions) {
      await app.models.Permission.getOrCreate(`${Model.tableName}:${action}`);
    }
  }
  process.exit();
}

createPermissions();
