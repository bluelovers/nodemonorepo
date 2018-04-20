import * as process from 'process'

import {
  CommandModule,
  Options,
  Argv,
  Arguments
} from 'yargs'

import {
  listMismatchedDependencies,
  updateDependencyVersions,
  MismatchedDependencyListItem
} from '../../../../../index'

import {
  Checker
} from '../../../../../lib/mismatches'

function builder (yargs: Argv): Argv {
  return yargs
    .positional('directory', {
      describe: 'Directory of monorepo',
      type: 'string'
    })
    .options({
      update: {
        alias: 'u',
        describe: 'Automatically update dependency versions to match their source',
        type: 'boolean',
        default: false
      },
      checker: {
        alias: 'c',
        describe: 'Checker to be used',
        type: 'string',
        default: 'CARET_EQUAL_OR_ANY',
        choices: Object.keys(listMismatchedDependencies.allCheckers)
      },
      noExitStatus: {
        describe: 'Do not exit with code 1 when there are outdated dependencies',
        type: 'boolean',
        default: false
      },
      noPrint: {
        alias: ['quiet', 'q'],
        describe: 'Do not print mismatches to stdout',
        type: 'boolean',
        default: false
      }
    })
}

function handler (argv: Arguments & {
  directory: string,
  update: boolean,
  checker: string,
  noExitStatus: boolean,
  noPrint: boolean
}) {
  const {
    directory,
    update,
    checker,
    noExitStatus,
    noPrint
  } = argv

  const check = listMismatchedDependencies.allCheckers[checker]

  if (!check) {
    console.error('Invalid checker name')
    process.exit(2)
  }

  ; (async function main () {
    let status = 0
    if (!noPrint) status += await read()
    if (update) status += await write()
    return status
  })().then(
    status => process.exit(status),
    error => {
      console.error(error)
      process.exit(1)
    }
  )

  async function read () {
    const map = await listMismatchedDependencies(directory, check)

    let finalExitStatus = 0

    const updateExitStatus = noExitStatus || update
      ? () => {}
      : () => { finalExitStatus = 1 }

    for (const {list, dependant} of Object.values(map)) {
      const messages: string[] = list
        .filter(({update, requirement}) => update !== requirement)
        .map(mkmsg)

      if (messages.length) {
        updateExitStatus()

        console.info(`* ${
          dependant.manifestContent.name || '[anonymous]'
        } (path: ${dependant.path})`)

        messages.forEach(x => console.info(x))
        console.info()
      }

      function mkmsg ({
        name,
        update,
        type,
        version,
        requirement
      }: MismatchedDependencyListItem): string {
        const additionalInfo = `(type: ${type}, upstream: ${version}, outdated: ${requirement})`
        return `  - ${name} → ${update} ${additionalInfo}`
      }
    }

    return finalExitStatus
  }

  async function write () {
    await updateDependencyVersions(directory, check)
    return 0
  }
}

export default {
  command: 'mismatches <directory>',
  describe: 'Manage mismatched internal dependency versions',
  builder,
  handler
} as CommandModule
