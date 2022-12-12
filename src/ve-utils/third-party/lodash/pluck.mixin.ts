import _ from 'lodash'

declare module 'lodash' {
    interface LoDashStatic {
        properties: (paths: any[]) => any
        pluck: (obj: any, ...keys: any[]) => any
    }
}

_.mixin({
    properties: (paths: [any]) => (obj) =>
        paths.reduce((memo, path) => [...memo, obj[path]], []),
    pluck: (obj, ...keys) =>
        _.map(
            obj,
            _.flatten(keys).length > 1
                ? _.properties(_.flatten(keys))
                : (o: any) => o[keys[0]]
        ),
})
