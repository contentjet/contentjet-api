import * as inquirer from 'inquirer';
import '../app';
import User from '../models/User';

async function main() {
  try {
    const data = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter your name',
        suffix: ':',
        validate(value: string) {
          if (value.length >= 1 && value.length <= 128) return true;
          return 'Value must be between 1 and 128 characters long.';
        }
      },
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address',
        suffix: ':'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter a password',
        suffix: ':'
      }
    ]);
    await User.create(
      data.email,
      data.name,
      data.password,
      true,
      true
    );
    console.log('User created'); // tslint:disable-line
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
