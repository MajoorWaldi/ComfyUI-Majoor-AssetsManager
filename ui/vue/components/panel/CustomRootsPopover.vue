<script setup lang="ts">
/**
 * CustomRootsPopover.vue — Custom browser root folder selector.
 *
 * The customRootsController drives this popover imperatively:
 *   - populates customSelect via innerHTML / appendChild
 *   - toggles customRemoveBtn.disabled
 *   - listens to customAddBtn click
 *
 * Exposes the same DOM refs as createCustomPopoverView() so the controller
 * requires no changes. Visibility is controlled by the legacy popoverManager.
 */
import { ref } from "vue";
import { t } from "../../../app/i18n.js";

interface RootOption {
    label: string;
    value: string;
    disabled: boolean;
    text?: string;
    textContent?: string;
}

interface RawOptionInput {
    value?: unknown;
    textContent?: unknown;
    text?: unknown;
    label?: unknown;
    disabled?: unknown;
}

type MaybeComponentRef = { $el?: HTMLElement } | HTMLElement | null;

const customRootOptions = ref<RootOption[]>([
    {
        label: t("label.selectFolder", "Select folder..."),
        value: "",
        disabled: false,
    },
]);
const customRootValue = ref("");
const customRootDisabled = ref(false);
const customAddBtnRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const customRemoveBtnRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);

const resolveDomElement = (value: MaybeComponentRef) => (value as { $el?: HTMLElement } | null)?.$el || value || null;

const customSelectEventTarget = new EventTarget();

const normalizeOptionElement = (option: RawOptionInput): RootOption => ({
    value: String(option?.value || ""),
    label: String(option?.textContent || option?.text || option?.label || ""),
    text: String(option?.text || option?.textContent || option?.label || ""),
    textContent: String(option?.textContent || option?.text || option?.label || ""),
    disabled: Boolean(option?.disabled),
});

const findOptionByValue = (value: unknown) =>
    customRootOptions.value.find((option) => String(option.value || "") === String(value || "")) ||
    null;

const customSelectFacade = {
    get value() {
        return customRootValue.value;
    },
    set value(nextValue: unknown) {
        const normalized = String(nextValue || "");
        customRootValue.value = findOptionByValue(normalized) ? normalized : "";
    },
    get disabled() {
        return customRootDisabled.value;
    },
    set disabled(nextDisabled: unknown) {
        customRootDisabled.value = Boolean(nextDisabled);
    },
    get options() {
        return customRootOptions.value;
    },
    get selectedIndex() {
        return Math.max(
            0,
            customRootOptions.value.findIndex(
                (option) => String(option.value || "") === String(customRootValue.value || ""),
            ),
        );
    },
    set selectedIndex(nextIndex: unknown) {
        const option = customRootOptions.value[Number(nextIndex) || 0] || customRootOptions.value[0];
        customRootValue.value = String(option?.value || "");
    },
    get selectedOptions() {
        const option = customRootOptions.value[this.selectedIndex] || null;
        return option ? [option] : [];
    },
    get innerHTML() {
        return "";
    },
    set innerHTML(_html: unknown) {
        customRootOptions.value = [];
        customRootValue.value = "";
    },
    appendChild(option: RawOptionInput) {
        const normalized = normalizeOptionElement(option);
        customRootOptions.value = [...customRootOptions.value, normalized];
        return option;
    },
    querySelector(selector: string) {
        if (selector !== 'option[value=""]') return null;
        return findOptionByValue("");
    },
    addEventListener(event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        customSelectEventTarget.addEventListener(event, handler, options);
    },
    removeEventListener(event: string, handler: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        customSelectEventTarget.removeEventListener(event, handler, options);
    },
    dispatchEvent(event: Event) {
        return customSelectEventTarget.dispatchEvent(event);
    },
};

function handleCustomRootValue(value: unknown) {
    customSelectFacade.value = value;
    try {
        customSelectFacade.dispatchEvent(new Event("change"));
    } catch (e) {
        console.debug?.(e);
    }
}

defineExpose({
    get customSelect()    { return customSelectFacade; },
    get customAddBtn()    { return resolveDomElement(customAddBtnRef.value); },
    get customRemoveBtn() { return resolveDomElement(customRemoveBtnRef.value); },
});
</script>

<template>
    <div class="mjr-popover mjr-custom-popover" style="display: none;">
        <div class="mjr-popover-row">
            <div class="mjr-popover-label">{{ t("label.folder") }}</div>
            <MSelect
                class="mjr-select"
                :model-value="customRootValue"
                :options="customRootOptions"
                option-label="label"
                option-value="value"
                :disabled="customRootDisabled"
                @update:model-value="handleCustomRootValue"
            />
        </div>
        <div class="mjr-popover-row mjr-popover-row--actions">
            <MButton ref="customAddBtnRef" type="button" class="mjr-btn" severity="secondary">
                {{ t("btn.add") }}
            </MButton>
            <MButton ref="customRemoveBtnRef" type="button" class="mjr-btn" severity="secondary" disabled>
                {{ t("btn.remove") }}
            </MButton>
        </div>
    </div>
</template>
