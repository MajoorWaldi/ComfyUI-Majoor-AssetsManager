<script setup lang="ts">
/**
 * StudioFxDefs.vue - hidden SVG filter applied with CSS `filter: url(#id)`.
 *
 * GPU-side, so it works on images and on playing video: optional A-B
 * subtraction (feImage of B), exposure, display gamma and channel isolation.
 */
import { computed } from "vue";

import {
    channelMatrix,
    exposureSlope,
    gammaExponent,
    type StudioChannel,
} from "../../../../features/viewer/studio/studioFx.js";

const props = defineProps<{
    filterId: string;
    channel: StudioChannel;
    exposure: number;
    gamma: number;
    /** When set, the filtered element shows A − B (B drawn via feImage). */
    subtractSrc?: string | null;
}>();

const matrix = computed(() => channelMatrix(props.channel));
const slope = computed(() => exposureSlope(props.exposure));
const exponent = computed(() => gammaExponent(props.gamma));
</script>

<template>
    <svg class="mjr-studio-fx-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
            <filter
                :id="filterId"
                x="0"
                y="0"
                width="1"
                height="1"
                filterUnits="objectBoundingBox"
                primitiveUnits="objectBoundingBox"
                color-interpolation-filters="sRGB"
            >
                <template v-if="subtractSrc">
                    <!-- A - B computed as A + (1 - B) - 1 so alpha stays at 1. -->
                    <feImage
                        :href="subtractSrc"
                        x="0"
                        y="0"
                        width="1"
                        height="1"
                        preserveAspectRatio="none"
                        result="mjrB"
                    />
                    <feComponentTransfer in="mjrB" result="mjrInvB">
                        <feFuncR type="table" tableValues="1 0" />
                        <feFuncG type="table" tableValues="1 0" />
                        <feFuncB type="table" tableValues="1 0" />
                    </feComponentTransfer>
                    <feComposite
                        in="SourceGraphic"
                        in2="mjrInvB"
                        operator="arithmetic"
                        k1="0"
                        k2="1"
                        k3="1"
                        k4="-1"
                        result="mjrBase"
                    />
                </template>
                <feComponentTransfer
                    :in="subtractSrc ? 'mjrBase' : 'SourceGraphic'"
                    result="mjrExposed"
                >
                    <feFuncR type="linear" :slope="slope" />
                    <feFuncG type="linear" :slope="slope" />
                    <feFuncB type="linear" :slope="slope" />
                </feComponentTransfer>
                <feComponentTransfer in="mjrExposed" result="mjrGamma">
                    <feFuncR type="gamma" amplitude="1" :exponent="exponent" offset="0" />
                    <feFuncG type="gamma" amplitude="1" :exponent="exponent" offset="0" />
                    <feFuncB type="gamma" amplitude="1" :exponent="exponent" offset="0" />
                </feComponentTransfer>
                <feColorMatrix v-if="matrix" in="mjrGamma" type="matrix" :values="matrix" />
            </filter>
        </defs>
    </svg>
</template>
