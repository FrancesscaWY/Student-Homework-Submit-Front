import {createApp} from 'vue'
import App from './App.vue'
import router from './router.ts'
// import vuetify from "vite-plugin-vuetify";
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.min.css'

const vuetify = createVuetify()

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')