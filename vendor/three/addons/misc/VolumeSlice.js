import {
    ClampToEdgeWrapping,
    DoubleSide,
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Texture,
    SRGBColorSpace,
} from '../../three.module.js';

class VolumeSlice {
    constructor(volume, index = 0, axis = 'z') {
        const slice = this;
        this.volume = volume;

        Object.defineProperty(this, 'index', {
            get: function () {
                return index;
            },
            set: function (value) {
                index = value;
                slice.geometryNeedsUpdate = true;
            },
        });

        this.axis = axis;
        this.canvas = document.createElement('canvas');
        this.ctx = undefined;
        this.canvasBuffer = document.createElement('canvas');
        this.ctxBuffer = undefined;

        this.updateGeometry();

        const canvasMap = new Texture(this.canvas);
        canvasMap.minFilter = LinearFilter;
        canvasMap.generateMipmaps = false;
        canvasMap.wrapS = canvasMap.wrapT = ClampToEdgeWrapping;
        canvasMap.colorSpace = SRGBColorSpace;
        const material = new MeshBasicMaterial({ map: canvasMap, side: DoubleSide, transparent: true });

        this.mesh = new Mesh(this.geometry, material);
        this.mesh.matrixAutoUpdate = false;
        this.geometryNeedsUpdate = true;
        this.repaint();
        this.iLength = 0;
        this.jLength = 0;
        this.sliceAccess = null;
    }

    repaint() {
        if (this.geometryNeedsUpdate) {
            this.updateGeometry();
        }

        const iLength = this.iLength;
        const jLength = this.jLength;
        const sliceAccess = this.sliceAccess;
        const volume = this.volume;
        const canvas = this.canvasBuffer;
        const ctx = this.ctxBuffer;
        const imgData = ctx.getImageData(0, 0, iLength, jLength);
        const data = imgData.data;
        const volumeData = volume.data;
        const upperThreshold = volume.upperThreshold;
        const lowerThreshold = volume.lowerThreshold;
        const windowLow = volume.windowLow;
        const windowHigh = volume.windowHigh;
        let pixelCount = 0;

        if (volume.dataType === 'label') {
            console.error('THREE.VolumeSlice.repaint: label are not supported yet');
        } else {
            for (let j = 0; j < jLength; j++) {
                for (let i = 0; i < iLength; i++) {
                    let value = volumeData[sliceAccess(i, j)];
                    let alpha = 0xff;
                    alpha = upperThreshold >= value ? (lowerThreshold <= value ? alpha : 0) : 0;
                    value = Math.floor(255 * (value - windowLow) / (windowHigh - windowLow));
                    value = value > 255 ? 255 : (value < 0 ? 0 : value | 0);

                    data[4 * pixelCount] = value;
                    data[4 * pixelCount + 1] = value;
                    data[4 * pixelCount + 2] = value;
                    data[4 * pixelCount + 3] = alpha;
                    pixelCount++;
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
        this.ctx.drawImage(canvas, 0, 0, iLength, jLength, 0, 0, this.canvas.width, this.canvas.height);
        this.mesh.material.map.needsUpdate = true;
    }

    updateGeometry() {
        const extracted = this.volume.extractPerpendicularPlane(this.axis, this.index);
        this.sliceAccess = extracted.sliceAccess;
        this.jLength = extracted.jLength;
        this.iLength = extracted.iLength;
        this.matrix = extracted.matrix;

        this.canvas.width = extracted.planeWidth;
        this.canvas.height = extracted.planeHeight;
        this.canvasBuffer.width = this.iLength;
        this.canvasBuffer.height = this.jLength;
        this.ctx = this.canvas.getContext('2d');
        this.ctxBuffer = this.canvasBuffer.getContext('2d');

        if (this.geometry) this.geometry.dispose();
        this.geometry = new PlaneGeometry(extracted.planeWidth, extracted.planeHeight);

        if (this.mesh) {
            this.mesh.geometry = this.geometry;
            this.mesh.matrix.identity();
            this.mesh.applyMatrix4(this.matrix);
        }

        this.geometryNeedsUpdate = false;
    }
}

export { VolumeSlice };
