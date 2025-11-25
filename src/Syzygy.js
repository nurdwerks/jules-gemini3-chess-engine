class Syzygy {
    constructor() {
        this.enabled = false;
        this.path = null;
        // Placeholder for TB
    }

    loadTable(path) {
        this.path = path;
        // Mock loading
        // console.log(`Syzygy TB loaded from ${path}`);
        this.enabled = true;
    }

    probeWDL(board) {
        if (!this.enabled) return null;
        // Mock probe
        return null;
    }

    probeDTZ(board) {
        if (!this.enabled) return null;
        return null;
    }
}

module.exports = Syzygy;
