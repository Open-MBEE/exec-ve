;(function () {
    $.ajax('config/config.json', {
        async: false,
        global: false,
        dataType: 'json',
        success: function (data) {
            window.__env = window.__env || {}
            window.__env = Object.assign(window.__env, data)
        },
    })
})()
