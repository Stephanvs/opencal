/**
 * OpenCal CLI
 *
 * Command-line interface for managing authentication and configuration.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loginCommand } from './commands/auth/login';
import { listCommand } from './commands/auth/list';
import { logoutCommand } from './commands/auth/logout';

yargs(hideBin(process.argv))
  .scriptName('opencal')
  .usage('$0 <command> [options]')
  .command(
    'auth',
    'Manage authentication with calendar providers',
    (yargs) => {
      return yargs
        .command(
          'login [provider]',
          'Authenticate with a calendar provider',
          (yargs) => {
            return yargs.positional('provider', {
              describe: 'Calendar provider to authenticate with',
              type: 'string',
              default: 'google',
              choices: ['google', 'microsoft'],
            });
          },
          loginCommand
        )
        .command(
          ['list', 'ls'],
          'List authenticated providers',
          {},
          listCommand
        )
        .command(
          'logout [provider]',
          'Remove authentication credentials',
          (yargs) => {
            return yargs.positional('provider', {
              describe: 'Provider to logout from (omit to logout from all)',
              type: 'string',
              choices: ['google', 'microsoft'],
            });
          },
          logoutCommand
        )
        .demandCommand(1, 'Please specify an auth subcommand')
        .help();
    }
  )
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .alias('h', 'help')
  .version('0.1.0')
  .alias('v', 'version')
  .epilogue(
    'For more information, visit: https://github.com/Stephanvs/opencal'
  )
  .parse();
