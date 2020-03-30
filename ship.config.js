module.exports = {
  mergeStrategy: { toSameBranch: ['master'] },
  monorepo: {
    mainVersionFile: 'lerna.json',
    packagesToBump: ['packages/*'],
    packagesToPublish: ['packages/*']
  }
}
