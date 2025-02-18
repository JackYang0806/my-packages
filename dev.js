import Vue from 'vue';
import App from './src/App.vue';
// import MyPackages from './dist/index'
// Vue.use(MyPackages);

new Vue({
    el: '#app',
    render: h => h(App)
});