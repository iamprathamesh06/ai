const native = require('./build/Release/stealth_overlay');

class StealthOverlay {
    create(width = 960, height = 640) {
        return native.create(width, height);
    }
    show() { native.show(); }
    hide() { native.hide(); }
    toggle() { native.toggle(); }
    move(x, y) { native.move(x, y); }
    setClickThrough(enable) { native.setClickThrough(enable); }
    setOpacity(alpha) { native.setOpacity(Math.max(0, Math.min(255, alpha))); }
    bringToFront() { native.bringToFront(); }
}

module.exports = new StealthOverlay();