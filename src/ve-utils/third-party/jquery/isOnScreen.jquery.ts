import jQuery from 'jquery';

jQuery.fn.isOnScreen = (x?, y?): boolean => {
    if (x == null || typeof x == 'undefined') x = 1;
    if (y == null || typeof y == 'undefined') y = 1;

    const win = $(window);

    const viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft(),
        right: win.scrollLeft() + win.width(),
        bottom: win.scrollTop() + win.height(),
    };

    const height = jQuery.fn.outerHeight();
    const width = jQuery.fn.outerWidth();

    if (!width || !height) {
        return false;
    }

    const bounds: {
        right?: number;
        left: number;
        bottom?: number;
        top: number;
    } = jQuery.fn.offset();
    bounds.right = bounds.left + width;
    bounds.bottom = bounds.top + height;

    const visible = !(
        viewport.right < bounds.left ||
        viewport.left > bounds.right ||
        viewport.bottom < bounds.top ||
        viewport.top > bounds.bottom
    );

    if (!visible) {
        return false;
    }

    const deltas = {
        top: Math.min(1, (bounds.bottom - viewport.top) / height),
        bottom: Math.min(1, (viewport.bottom - bounds.top) / height),
        left: Math.min(1, (bounds.right - viewport.left) / width),
        right: Math.min(1, (viewport.right - bounds.left) / width),
    };

    return deltas.left * deltas.right >= x && deltas.top * deltas.bottom >= y;
};
