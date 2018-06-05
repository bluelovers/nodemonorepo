import * as path from 'path'
import {Traverse} from 'fs-tree-utils'
import getManifestType from './manifest-type'

import {
  Manifest
} from '../.types'

export function createFileChooser (
  prefix: string
): createFileChooser.FileChooser {
  return x => {
    const {name, ext} = path.parse(x.item)
    return name === prefix ? getManifestType(ext) : null
  }
}

export namespace createFileChooser {
  export interface FileChooser {
    (param: FileChooser.Param): FileChooser.Result
  }

  export namespace FileChooser {
    export type Param = Traverse.Options.DeepFunc.Param
    export type Result = Manifest.Type | null
  }
}

export default createFileChooser
