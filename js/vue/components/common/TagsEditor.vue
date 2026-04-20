<script setup>
/**
 * TagsEditor.vue - Interactive tags editor with autocomplete.
 *
 * Phase 4.1: Replaces createTagsEditor() from TagsEditor.js.
 * Emits tags-change event when tags are updated.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getAvailableTags, updateAssetTags } from "../../../api/client.js";
import { ASSET_TAGS_CHANGED_EVENT } from "../../../app/events.js";
import { t } from "../../../app/i18n.js";
import { comfyToast } from "../../../app/toast.js";
import { safeDispatchCustomEvent } from "../../../utils/events.js";
import { normalizeAssetId } from "../../../utils/ids.js";

const MAX_TAG_LEN = 100;
const MAX_TAGS = 200;

function normalizeInputTag(raw) {
    try {
        const value = String(raw ?? "").trim();
        if (!value) return null;
        if (value.length > MAX_TAG_LEN) return null;
        for (let index = 0; index < value.length; index += 1) {
            const code = value.charCodeAt(index);
            if (code <= 31 || code === 127) return null;
        }
        if (/[;,]/.test(value)) return null;
        return value;
    } catch {
        return null;
    }
}

function normalizeStoredTag(raw) {
    try {
        const value = String(raw ?? "")
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x1f\x7f]/g, "")
            .trim();
        return value || null;
    } catch {
        return null;
    }
}

function tagKey(raw) {
    const normalized = normalizeStoredTag(raw);
    return normalized ? normalized.toLowerCase() : "";
}

function dedupeTags(rawTags) {
    const next = [];
    const seen = new Set();
    for (const raw of Array.isArray(rawTags) ? rawTags : []) {
        const normalized = normalizeStoredTag(raw);
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(normalized);
        if (next.length >= MAX_TAGS) break;
    }
    return next;
}

function normalizeTags(rawTags) {
    if (Array.isArray(rawTags)) {
        return dedupeTags(rawTags);
    }
    if (typeof rawTags === "string") {
        const trimmed = rawTags.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return dedupeTags(parsed);
        } catch {
            return dedupeTags(trimmed.split(","));
        }
    }
    return [];
}

function areTagsEqual(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
    }
    return true;
}

const props = defineProps({
    asset: {
        type: Object,
        required: true,
    },
    modelValue: {
        type: [Array, String],
        default: () => [],
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:modelValue", "tags-change"]);

const initialTags = normalizeTags(props.asset?.tags ?? props.modelValue ?? []);
const tags = ref([...initialTags]);
const inputRef = ref(null);
const inputValue = ref("");
const showDropdown = ref(false);
const selectedIndex = ref(-1);
const availableTags = ref([]);
const saving = ref(false);

let saveInFlight = false;
let savePending = false;
let saveAC = null;
let lastSaved = [...initialTags];

const retryDelay = (attemptIndex) => Math.min(100 * 2 ** Math.max(0, attemptIndex - 1), 2000);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const handleInputBlur = () => setTimeout(() => (showDropdown.value = false), 200);

const filteredSuggestions = computed(() => {
    const query = inputValue.value.toLowerCase().trim();
    if (!query) return [];

    const currentKeys = new Set(tags.value.map((tag) => tagKey(tag)).filter(Boolean));
    return availableTags.value
        .filter((tag) => {
            const key = tagKey(tag);
            return tag.toLowerCase().includes(query) && (!key || !currentKeys.has(key));
        })
        .slice(0, 10);
});

const hasSuggestions = computed(() => filteredSuggestions.value.length > 0);

function syncFromExternal(rawTags) {
    if (saveInFlight) return;
    const normalized = normalizeTags(rawTags);
    lastSaved = [...normalized];
    if (!areTagsEqual(normalized, tags.value)) {
        tags.value = [...normalized];
    }
}

function emitPersistedTags(nextTags) {
    const normalized = [...nextTags];
    const assetId = props.asset?.id != null ? String(props.asset.id) : "";
    emit("update:modelValue", normalized);
    emit("tags-change", { assetId: props.asset?.id, tags: normalized });
    safeDispatchCustomEvent(ASSET_TAGS_CHANGED_EVENT, {
        assetId,
        tags: normalized,
    });
}

async function saveTags() {
    if (props.disabled) return;
    if (saveInFlight) {
        savePending = true;
        try {
            saveAC?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        return;
    }

    saveInFlight = true;
    saving.value = true;

    let attempts = 0;
    while (attempts < 10) {
        if (attempts > 0) {
            await wait(retryDelay(attempts));
        }
        attempts += 1;

        const snapshot = normalizeTags(tags.value);
        const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
        saveAC = ac;

        let result = null;
        try {
            result = await updateAssetTags(props.asset, snapshot, ac ? { signal: ac.signal } : {});
        } catch (err) {
            console.error("Failed to update tags:", err);
        }

        if (!result?.ok) {
            if (result?.code === "ABORTED") {
                if (savePending) {
                    savePending = false;
                    continue;
                }
                break;
            }

            const reverted = [...lastSaved];
            tags.value = reverted;
            emit("update:modelValue", reverted);
            comfyToast(result?.error || t("toast.tagsUpdateFailed", "Failed to update tags"), "error");
            saveInFlight = false;
            saveAC = null;
            saving.value = false;
            return;
        }

        try {
            const newId = result?.data?.asset_id ?? null;
            if (newId != null && !normalizeAssetId(props.asset.id)) props.asset.id = newId;
        } catch (e) {
            console.debug?.(e);
        }

        const persisted = normalizeTags(
            Array.isArray(result?.data?.tags) ? result.data.tags : snapshot,
        );
        lastSaved = [...persisted];
        try {
            props.asset.tags = [...persisted];
        } catch (e) {
            console.debug?.(e);
        }
        if (!savePending) {
            tags.value = [...persisted];
        }
        emitPersistedTags(persisted);
        comfyToast(t("toast.tagsUpdated", "Tags updated"), "success", 1000);

        if (!savePending) break;
        savePending = false;
    }

    if (attempts >= 10) {
        const reverted = [...lastSaved];
        tags.value = reverted;
        try {
            props.asset.tags = [...reverted];
        } catch (e) {
            console.debug?.(e);
        }
        emit("update:modelValue", reverted);
        comfyToast(t("toast.tagsUpdateFailed", "Failed to update tags"), "error");
    }

    saveInFlight = false;
    saveAC = null;
    saving.value = false;
}

onMounted(async () => {
    try {
        const result = await getAvailableTags();
        if (result?.ok && Array.isArray(result?.data)) {
            availableTags.value = dedupeTags(result.data);
        }
    } catch (err) {
        console.warn("Failed to load available tags:", err);
    }
});

onBeforeUnmount(() => {
    try {
        saveAC?.abort?.();
    } catch (e) {
        console.debug?.(e);
    }
});

function addTag(tag) {
    if (props.disabled) return;
    const normalized = normalizeInputTag(tag);
    if (!normalized) return;

    const key = tagKey(normalized);
    if (!key) return;
    if (tags.value.some((existing) => tagKey(existing) === key)) return;
    if (tags.value.length >= MAX_TAGS) {
        comfyToast(t("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
        return;
    }

    tags.value = [...tags.value, normalized];
    void saveTags();
}

function removeTag(index) {
    if (props.disabled) return;
    if (index < 0 || index >= tags.value.length) return;
    const next = [...tags.value];
    next.splice(index, 1);
    tags.value = next;
    void saveTags();
}

function handleInputKeydown(event) {
    if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        const tag = inputValue.value.trim();
        if (tag) {
            addTag(tag);
            inputValue.value = "";
            showDropdown.value = false;
            selectedIndex.value = -1;
        }
        return;
    }

    if (event.key === "Escape") {
        showDropdown.value = false;
        selectedIndex.value = -1;
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();
        if (hasSuggestions.value) {
            selectedIndex.value = Math.min(
                selectedIndex.value + 1,
                filteredSuggestions.value.length - 1,
            );
        }
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
        return;
    }

    if (event.key === "Tab" && hasSuggestions.value) {
        event.preventDefault();
        const selected =
            filteredSuggestions.value[selectedIndex.value] || filteredSuggestions.value[0];
        if (selected) {
            inputValue.value = selected;
        }
    }
}

function selectSuggestion(tag) {
    addTag(tag);
    inputValue.value = "";
    showDropdown.value = false;
    selectedIndex.value = -1;
    inputRef.value?.focus();
}

watch(
    () => props.modelValue,
    (newVal) => {
        syncFromExternal(newVal);
    },
);

watch(
    () => props.asset?.tags,
    (newVal) => {
        syncFromExternal(newVal);
    },
);
</script>

<template>
    <div
        class="mjr-tags-editor"
        :class="{ 'is-disabled': disabled }"
        :aria-busy="saving"
    >
        <div
            class="mjr-tags-display"
            role="list"
            :aria-label="t('tags.label', 'Tags')"
        >
            <template v-if="tags.length === 0">
                <span class="mjr-tags-empty">
                    {{ t("msg.noTagsYet", "No tags yet...") }}
                </span>
            </template>
            <template v-else>
                <div
                    v-for="(tag, index) in tags"
                    :key="tag"
                    class="mjr-tag-chip"
                    role="listitem"
                >
                    {{ tag }}
                    <button
                        type="button"
                        class="mjr-tag-chip-remove"
                        :aria-label="t('tags.remove', 'Remove tag')"
                        :disabled="disabled"
                        @click="removeTag(index)"
                    >
                        &times;
                    </button>
                </div>
            </template>
        </div>

        <div class="mjr-tags-input-wrap">
            <input
                ref="inputRef"
                v-model="inputValue"
                type="text"
                class="mjr-tag-input"
                :placeholder="t('sidebar.addTag', 'Add tag...')"
                :disabled="disabled"
                :aria-label="t('tags.addLabel', 'Add tag')"
                :aria-autocomplete="hasSuggestions ? 'list' : 'none'"
                :aria-expanded="showDropdown"
                :aria-haspopup="hasSuggestions ? 'listbox' : undefined"
                @focus="showDropdown = inputValue.length > 0"
                @input="showDropdown = inputValue.length > 0"
                @keydown="handleInputKeydown"
                @blur="handleInputBlur"
            />

            <div
                v-show="showDropdown && hasSuggestions"
                class="mjr-tags-dropdown"
                role="listbox"
                :aria-label="t('tags.suggestions', 'Tag suggestions')"
            >
                <div
                    v-for="(suggestion, idx) in filteredSuggestions"
                    :key="suggestion"
                    class="mjr-tag-suggestion"
                    :class="{ 'is-active': idx === selectedIndex }"
                    role="option"
                    :aria-selected="idx === selectedIndex"
                    @click="selectSuggestion(suggestion)"
                    @mouseenter="selectedIndex = idx"
                >
                    {{ suggestion }}
                </div>
            </div>
        </div>
    </div>
</template>
