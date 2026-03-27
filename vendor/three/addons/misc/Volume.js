import {
    Matrix3,
    Matrix4,
    Vector3,
} from '../../three.module.js';
import { VolumeSlice } from './VolumeSlice.js';

class Volume {
    constructor(xLength, yLength, zLength, type, arrayBuffer) {
        if (xLength !== undefined) {
            this.xLength = Number(xLength) || 1;
            this.yLength = Number(yLength) || 1;
            this.zLength = Number(zLength) || 1;
            this.axisOrder = ['x', 'y', 'z'];
            this.data = undefined;

            switch (type) {
            case 'Uint8':
            case 'uint8':
            case 'uchar':
            case 'unsigned char':
            case 'uint8_t':
                this.data = new Uint8Array(arrayBuffer);
                break;
            case 'Int8':
            case 'int8':
            case 'signed char':
            case 'int8_t':
                this.data = new Int8Array(arrayBuffer);
                break;
            case 'Int16':
            case 'int16':
            case 'short':
            case 'short int':
            case 'signed short':
            case 'signed short int':
            case 'int16_t':
                this.data = new Int16Array(arrayBuffer);
                break;
            case 'Uint16':
            case 'uint16':
            case 'ushort':
            case 'unsigned short':
            case 'unsigned short int':
            case 'uint16_t':
                this.data = new Uint16Array(arrayBuffer);
                break;
            case 'Int32':
            case 'int32':
            case 'int':
            case 'signed int':
            case 'int32_t':
                this.data = new Int32Array(arrayBuffer);
                break;
            case 'Uint32':
            case 'uint32':
            case 'uint':
            case 'unsigned int':
            case 'uint32_t':
                this.data = new Uint32Array(arrayBuffer);
                break;
            case 'longlong':
            case 'long long':
            case 'long long int':
            case 'signed long long':
            case 'signed long long int':
            case 'int64':
            case 'int64_t':
            case 'ulonglong':
            case 'unsigned long long':
            case 'unsigned long long int':
            case 'uint64':
            case 'uint64_t':
                throw new Error('Error in Volume constructor : this type is not supported in JavaScript');
            case 'Float32':
            case 'float32':
            case 'float':
                this.data = new Float32Array(arrayBuffer);
                break;
            case 'Float64':
            case 'float64':
            case 'double':
                this.data = new Float64Array(arrayBuffer);
                break;
            default:
                this.data = new Uint8Array(arrayBuffer);
            }

            if (this.data.length !== this.xLength * this.yLength * this.zLength) {
                throw new Error('Error in Volume constructor, lengths are not matching arrayBuffer size');
            }
        }

        this.spacing = [1, 1, 1];
        this.offset = [0, 0, 0];
        this.matrix = new Matrix3();
        this.matrix.identity();
        this.inverseMatrix = new Matrix3();

        let lowerThreshold = -Infinity;
        Object.defineProperty(this, 'lowerThreshold', {
            get: function () {
                return lowerThreshold;
            },
            set: function (value) {
                lowerThreshold = value;
                this.sliceList.forEach(function (slice) {
                    slice.geometryNeedsUpdate = true;
                });
            },
        });

        let upperThreshold = Infinity;
        Object.defineProperty(this, 'upperThreshold', {
            get: function () {
                return upperThreshold;
            },
            set: function (value) {
                upperThreshold = value;
                this.sliceList.forEach(function (slice) {
                    slice.geometryNeedsUpdate = true;
                });
            },
        });

        this.sliceList = [];
        this.segmentation = false;
        this.RASDimensions = [];
    }

    getData(i, j, k) {
        return this.data[this.access(i, j, k)];
    }

    access(i, j, k) {
        return k * this.xLength * this.yLength + j * this.xLength + i;
    }

    reverseAccess(index) {
        const z = Math.floor(index / (this.yLength * this.xLength));
        const y = Math.floor((index - z * this.yLength * this.xLength) / this.xLength);
        const x = index - z * this.yLength * this.xLength - y * this.xLength;
        return [x, y, z];
    }

    map(functionToMap, context) {
        const length = this.data.length;
        context = context || this;
        for (let i = 0; i < length; i++) {
            this.data[i] = functionToMap.call(context, this.data[i], i, this.data);
        }
        return this;
    }

    computeMinMax() {
        let min = Infinity;
        let max = -Infinity;
        const datas = this.data;
        let i = 0;
        const length = datas.length;
        for (; i < length; i++) {
            if (!isNaN(datas[i])) {
                min = Math.min(min, datas[i]);
                max = Math.max(max, datas[i]);
            }
        }
        this.min = min;
        this.max = max;
        return [min, max];
    }

    extractPerpendicularPlane(axis, RASIndex) {
        let iLength;
        let jLength;
        let sliceAccess;
        let planeMatrix = new Matrix4();
        let volume = this;
        let planeWidth;
        let planeHeight;
        let firstSpacing;
        let secondSpacing;
        let positionOffset;

        axis = axis || 'z';
        RASIndex = RASIndex || 0;

        let axisInIJK = ['z', 'x', 'y'].indexOf(axis);
        let firstDirection = [1, 0, 0];
        let secondDirection = [0, 1, 0];
        let dimensions = [this.xLength, this.yLength, this.zLength];
        let spacing = this.spacing;

        switch (axisInIJK) {
        case 0:
            firstDirection = [0, 1, 0];
            secondDirection = [0, 0, 1];
            break;
        case 1:
            firstDirection = [1, 0, 0];
            secondDirection = [0, 0, 1];
            break;
        case 2:
        default:
            firstDirection = [1, 0, 0];
            secondDirection = [0, 1, 0];
            break;
        }

        let iDirection = [0, 0, 0];
        iDirection[axisInIJK] = 1;
        let firstSpacingIndex = firstDirection.indexOf(1);
        let secondSpacingIndex = secondDirection.indexOf(1);

        firstSpacing = spacing[firstSpacingIndex];
        secondSpacing = spacing[secondSpacingIndex];
        positionOffset = (RASIndex - dimensions[axisInIJK] / 2) * spacing[axisInIJK];

        planeMatrix.set(
            firstDirection[0], secondDirection[0], iDirection[0], 0,
            firstDirection[1], secondDirection[1], iDirection[1], 0,
            firstDirection[2], secondDirection[2], iDirection[2], 0,
            0, 0, 0, 1
        );
        planeMatrix.multiply(new Matrix4().makeTranslation(0, 0, positionOffset));
        planeMatrix.multiply(new Matrix4().set(
            this.matrix.elements[0], this.matrix.elements[1], this.matrix.elements[2], 0,
            this.matrix.elements[3], this.matrix.elements[4], this.matrix.elements[5], 0,
            this.matrix.elements[6], this.matrix.elements[7], this.matrix.elements[8], 0,
            0, 0, 0, 1
        ));

        iLength = dimensions[firstSpacingIndex];
        jLength = dimensions[secondSpacingIndex];
        planeWidth = Math.abs(iLength * firstSpacing);
        planeHeight = Math.abs(jLength * secondSpacing);

        sliceAccess = function (i, j) {
            let coordinates = [0, 0, 0];
            coordinates[firstSpacingIndex] = i;
            coordinates[secondSpacingIndex] = j;
            coordinates[axisInIJK] = RASIndex;
            return volume.access(coordinates[0], coordinates[1], coordinates[2]);
        };

        return {
            iLength: iLength,
            jLength: jLength,
            sliceAccess: sliceAccess,
            matrix: planeMatrix,
            planeWidth: planeWidth,
            planeHeight: planeHeight,
        };
    }

    extractSlice(axis, index) {
        const slice = new VolumeSlice(this, index, axis);
        this.sliceList.push(slice);
        return slice;
    }

    repaintAllSlices() {
        this.sliceList.forEach(function (slice) {
            slice.repaint();
        });
        return this;
    }
}

export { Volume };
