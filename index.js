#!/usr/bin/env node

// Import modules
const _ = require('lodash');
const path = require('path');
const yaml = require('node-yaml');
const chalk = require('chalk');
const figlet = require('figlet');
const stringArgv = require('string-argv');

const lib = require('./lib');

// Load the translation files
const engFilePath = path.resolve(process.cwd(), 'frontend/translations/en-us.yaml')
let eng;

try {
   eng = yaml.readSync(engFilePath);
} catch(error) {
  throw new Error('Unable to find yaml file');
}

// Start the prompt
const vorpal = require('vorpal')();

// Configure comands
vorpal
  .command('add <key> <translation>', 'Adds a new translation.')
  .option('-f, --force', 'Force translation overwrite.')
  .action(function(args, cb) {
    let self = this;

    let { key, translation } = args;
    let warnings = [];
    let errors = [];
    let matchingKey;
    let successMessage = chalk.green(`Added ${translation} at ${key}`);
    let writeOptions = {
      object: eng,
      filePath: engFilePath,
      key,
      translation
    };

    // Validate unless forced
    if (!args.options.force) {
      // Check for simple translations
      if (lib.isSimpleTranslation(key, translation)) {
        warnings.push('Simple translations are often better placed under major groupings such as global, actions, etc.')
      }

      // Check for existing translation at provided key
      matchingKey = _.get(eng, key);
      if (matchingKey) {
        warnings.push(`Existing translation at ${key}: ${matchingKey}`);
      }

      // Check for keys that already have this translation
      let duplicates = lib.findDuplicates(eng, translation);
      if (duplicates.length) {
        let message = 'This string has already been translated using the following keys:';
        message = message + duplicates.reduce((keys, duplicate) => {
          return `${keys}\n  ${duplicate}`;
        }, '');
        warnings.push(message);
      }

      if (warnings.length) {
        self.log(chalk.keyword('orange')('WARNING'));
        warnings.forEach((warning) => self.log(chalk.yellow(warning)));

        return self.prompt({
          type: 'confirm',
          name: 'continue',
          default: false,
          message: 'Add translation?'
        }, function(result) {
          if (result.continue) {
            lib.addAndWrite(writeOptions).then(() => self.log(successMessage));
          }
          cb();
        });
      }
    }

    lib.addAndWrite(writeOptions)
      .then(() => self.log(successMessage))
      .catch((error) => self.log(chalk.red(error)));

    cb();
  });

vorpal
  .command('find <translation>', 'Finds the key(s) of the provided string')
  .action(function(args, cb) {
    let { translation } = args;

    let keys = lib.findDuplicates(eng, translation);
    let count = keys.length;

    if (count) {
      this.log(chalk.green(`${count} matches found.`));
      keys.forEach((key) => this.log(` ${key}`))
    }

    cb();
  });

// Show welcome
console.log(chalk.yellow(figlet.textSync('3PO')));

// Start the prompt
vorpal
  .delimiter('3PO~$')
  .show();
