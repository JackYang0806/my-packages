import ExcelImport from "./packages/excel";
import PreviewImage from "./packages/images";
const components = [
    ExcelImport,
    PreviewImage
]
const install = function (Vue, opts = {}) {
    components.forEach(component => {
        Vue.component(component.name, component);
    });
};

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}
export default {
    version: '0.0.1',
    install,
    ExcelImport,
    PreviewImage
}