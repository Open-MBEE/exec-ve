export interface ElementObject extends Object {
  id : string
  _projectId: string
  _refId: string
  _commitId?: string
  _modified?: Date
  type?: string
  value?: any
  defaultValue?: any
  specification?: any
  name?: string
  [key: string]: any
}