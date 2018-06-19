import { models } from '../app';

const actions = ['create', 'update', 'list', 'retrieve', 'delete'];
const { Permission } = models;

const modelClasses = Object.values(models);

async function createPermissions() {
  for (const modelClass of modelClasses) {
    for (const action of actions) {
      await Permission.getOrCreate(`${modelClass.tableName}:${action}`);
    }
  }
  process.exit();
}

createPermissions();
