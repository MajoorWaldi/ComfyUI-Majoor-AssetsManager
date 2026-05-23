import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ToggleButton from "primevue/togglebutton";
import Badge from "primevue/badge";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import Menu from "primevue/menu";
import Listbox from "primevue/listbox";
import Tree from "primevue/tree";
import VirtualScroller from "primevue/virtualscroller";

const PRIME_COMPONENTS = {
    Button,
    Checkbox,
    InputText,
    Select,
    ToggleButton,
    Badge,
    Tag,
    Dialog,
    Menu,
    Listbox,
    Tree,
    VirtualScroller,
};

export function installMajoorPrimeVue(app) {
    app.use(PrimeVue, {
        ripple: false,
        unstyled: true,
        zIndex: {
            overlay: 10100,
        },
    });
    app.use(ToastService);
    app.use(ConfirmationService);
    Object.entries(PRIME_COMPONENTS).forEach(([name, component]) => {
        app.component(`M${name}`, component);
    });
    return app;
}
