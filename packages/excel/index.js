import ExcelImport from './src/index.vue';
/* istanbul ignore next */
ExcelImport.install = function (Vue) {
    Vue.component(ExcelImport.name, ExcelImport);
};

export default ExcelImport;
