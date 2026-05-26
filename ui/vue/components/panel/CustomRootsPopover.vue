<script setup>
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

const customRootOptions = ref([
    {
        label: t("label.selectFolder", "Select folder…"),
        value: "",
        disabled: false,
    },
]);
const customRootValue = ref("");
const customRootDisabled = ref(false);
const customAddBtnRef = ref(null);
const customRemoveBtnRef = ref(null);

const resolveDomElement = (value) => value?.$el || value || null;

const customSelectEventTarget = new EventTarget();

const normalizeOptionElement = (option) => ({
    value: String(option?.value || ""),
    label: String(option?.textContent || option?.text || option?.label || ""),
    text: String(option?.text || option?.textContent || option?.label || ""),
    textContent: String(option?.textContent || option?.text || option?.label || ""),
    disabled: Boolean(option?.disabled),
});

const findOptionByValue = (value) =>
    customRootOptions.value.find((option) => String(option.value || "") === String(value || "")) ||
    null;

const customSelectFacade = {
    get value() {
        return customRootValue.value;
    },
    set value(nextValue) {
        const normalized = String(nextValue || "");
        customRootValue.value = findOptionByValue(normalized) ? normalized : "";
    },
    get disabled() {
        return customRootDisabled.value;
    },
    set disabled(nextDisabled) {
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
    set selectedIndex(nextIndex) {
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
    set innerHTML(_html) {
        customRootOptions.value = [];
        customRootValue.value = "";
    },
    appendChild(option) {
        const normalized = normalizeOptionElement(option);
        customRootOptions.value = [...customRootOptions.value, normalized];
        return option;
    },
    querySelector(selector) {
        if (selector !== 'option[value=""]') return null;
        return findOptionByValue("");
    },
    addEventListener(event, handler, options) {
        customSelectEventTarget.addEventListener(event, handler, options);
    },
    removeEventListener(event, handler, options) {
        customSelectEventTarget.removeEventListener(event, handler, options);
    },
    dispatchEvent(event) {
        return customSelectEventTarget.dispatchEvent(event);
    },
};

function handleCustomRootValue(value) {
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
