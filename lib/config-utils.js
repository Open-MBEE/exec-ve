const _ = require('lodash');


function validate() {
    let veConfig = window.__env
    _test(veConfig, 'version', 'string', true)
    _test(veConfig, 'apiUrl', 'string', true)
    _test(veConfig, 'basePath', 'string', false)
    _test(veConfig, 'enableDebug', 'boolean', false)
    _test(veConfig, 'customLabels', 'object', false)
    if (veConfig.customLabels) {
        for (let key in Object.keys(veConfig.customLabels)) {
            _test(veConfig, `customLabels.${key}`, 'string');
        }
    }
    if (veConfig.loginBanner) {
        _test(veConfig, 'loginBanner.labels', 'Array', true)
        for (let [label] of veConfig.loginBanner.labels) {
            _test(veConfig, `loginBanner.labels.${label}`, 'Array', true)
            for (let [str] of veConfig.loginBanner.labels[label]) {
                _test(veConfig, `loginBanner.labels.${label}.${str}`, 'string', true)
            }
        }
        _test(veConfig, 'loginBanner.separator', 'string', false)
        _test(veConfig, 'loginBanner.background', 'string', false)
        _test(veConfig, 'loginBanner.color', 'string', false)
        _test(veConfig, 'loginBanner.enabled', 'boolean', false)
    }
    if (veConfig.banner) {
        if (veConfig.banner.message) {
            if (Array.isArray(veConfig.banner.message)) {
                for (let [msg] of veConfig.banner.message.entries()) {
                    _test(veConfig, `banner.message.${msg}`, 'string', true)
                }
            } else{
                _test(veConfig, 'banner.message', 'string', true)
            }
        }else{
            throw new Error()
        }

        _test(veConfig, 'banner.separator', 'string', false)
        _test(veConfig, 'banner.background', 'string', false)
        _test(veConfig, 'banner.color', 'string', false)
        _test(veConfig, 'banner.enabled', 'boolean', false)
    }
    if (veConfig.footer && !veConfig.footer.disabled) {
        _test(veConfig, 'footer.message', 'Array', true)
        if (Array.isArray(veConfig.footer.message)) {
            for (let [msg] of veConfig.footer.message.entries()) {
                _test(veConfig, `footer.message.${msg}`, 'string', true)
            }
        } else{
            _test(veConfig, 'footer.message', 'string', true)
        }
        _test(veConfig, 'footer.separator', 'string', false)
        _test(veConfig, 'footer.background', 'string', false)
        _test(veConfig, 'footer.color', 'string', false)
        _test(veConfig, 'footer.enabled', 'boolean', false)
    }

    _test(veConfig, 'loginTimeout', 'number', false)

    if (veConfig.extensions) {
        _test(veConfig, 'extensions', 'object', false)
    }
}

function _test(config, key, type, required) {
    const keys = key.split('.');

    // Get the field from an arbitrary depth of key nesting
    let field = config;
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        if (Number.isInteger(k)) {
            k = Number.parseInt(k);
        }
        field = field[k]

    }

    // Test that the field exists.
    if (field === undefined) {
        if(required)
            _throwError(key)
        else
            return
    }

    // Test that the field is the correct type.
    if (type === 'object') {
        if (typeof field !== 'object' || field === null) {
            _throwError(key, "object")
        }
    }
    else if (type === 'Array') {
        if (!Array.isArray(field)) {
            _throwError(key, "Array")
        }
    }
    else if (type === 'number') {
        if (!Number.isInteger(field)) {
            _throwError(key, "number")
        }
    }
    // eslint-disable-next-line valid-typeof
    else if (typeof field !== type) {
        _throwError(key, type)
    }
}

function _throwError(key, type) {
    if (type) {
        throw new Error(`Configuration file: "${key}" is not ${_testVowels(type) ? "an" : "a"} ${_.lowerCase(type)}`)
    }else {
        throw new Error(`Configuration file: "${key}" is not defined`);
    }

}

function _testVowels(e) {
    const regex = new RegExp('^[aeiou].*', 'i');
    return regex.test(e);
}