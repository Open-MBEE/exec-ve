// webpack.config.js
import hq from 'alias-hq'

module.exports = {
    resolve: {
        alias: hq.get('webpack')
    }
}