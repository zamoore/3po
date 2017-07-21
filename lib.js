const _ = require('lodash');
const sortObject = require('deep-sort-object');
const yaml = require('node-yaml');

module.exports = {
  addAndWrite({ object, filePath, key, translation }) {
    return new Promise((resolve, reject) => {
      let updated = _.set(object, key, translation);
      let sorted = sortObject(updated);

      yaml.write(filePath, sorted, (error) => {
        if (error) { reject(error); }
        resolve();
      });
    });
  },
  findDuplicates(file, translation, recursion) {
    let res = false;
    let paths = [];

    for (let key in file) {
      if (file.hasOwnProperty(key)) {
        if (typeof file[key] == 'object') {
          if (res = this.findDuplicates(file[key], translation, true)) {
            res = `${key}.${res}`;

            if (!recursion) {
              paths.push(res);
            } else {
              return res;
            }
          }
        } else if (translation === file[key]) {
          if (!recursion) {
            paths.push(key);
          } else {
            return key;
          }
        }
      }
    }
    return recursion ? res : paths;
  },
  isSimpleTranslation(key, translation) {
    let majorGroups = [
      'global',
      'actions',
      'table_headers'
    ];
    let smallTranslation = translation.trim().split(' ').length <= 2;
    let [rootKey] = key.split('.');

    return smallTranslation && !majorGroups.includes(rootKey);
  }
};
