import listManifestFiles from '../list-manifest-files'
import loadManifestDescriptor from '../load-manifest-descriptor'
import {Manifest} from '../.types'
import TaskSet = loadManifestDescriptor.TaskSet

/**
 * @param dirname Directory that contains all task manifest descriptors
 * @param options Specify deep function and file chooser
 * @returns A list of task collections
 */
export async function loadManifestFiles (
  dirname: string,
  options: loadManifestFiles.Options
): loadManifestFiles.Result {
  const list = await listManifestFiles(dirname, options)

  return Promise.all(
    list.map(async descriptor => ({
      descriptor,
      tasks: await loadManifestDescriptor(descriptor)
    }))
  )
}

export namespace loadManifestFiles {
  export type Options = listManifestFiles.Options

  export type Result = Promise<ReadonlyArray<Result.Item>>

  export namespace Result {
    export interface Item {
      readonly descriptor: Manifest.Descriptor
      readonly tasks: TaskSet
    }
  }
}

export default loadManifestFiles
