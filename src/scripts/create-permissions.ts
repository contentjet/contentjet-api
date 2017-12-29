import {models} from '../app';

const actions = ['create', 'update', 'list', 'retrieve', 'delete'];
const {Permission} = models;

const modelClasses = Object.values(models);

async function createPermissions() {
  for (let Model of modelClasses) {
    for (let action of actions) {
      await Permission.getOrCreate(`${Model.tableName}:${action}`);
    }
  }
  process.exit();
}

createPermissions();
