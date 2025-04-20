<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import axios from "axios";
import {ref,onMounted} from "vue";
const router = useRouter()
const loginError = ref<string>('')
// const StdName = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
import Cookies from 'js-cookie'



// 定义表单验证规则
const schema = yup.object({
  username: yup.string().required('用户名不能为空'),
  password: yup.string().required('密码不能为空')
})

// 绑定表单
const { handleSubmit } = useForm({
  validationSchema: schema
})

// 绑定输入字段
const { value: username, errorMessage: usernameError } = useField('username')
const { value: password, errorMessage: passwordError } = useField('password')

// 提交表单
const onSubmit = handleSubmit(async values => {
  try {
    const response = await axios.post('http:///localhost:3001/api/std/login', {
      username: values.username,
      password: values.password
    })

    console.log("服务器返回:", response.data); // 打印返回值，确认 `StdName` 不是 `undefined`

    if (response.data.success) {
      Cookies.set('savedUsername',values.username,{expires:7});
      Cookies.set('savedPassword',values.password,{expires:7});

      localStorage.setItem('username', response.data.StdName); // 确保存入的是字符串
      localStorage.setItem('StdID',response.data.username);
      router.push('/dashboard/submit')
    } else {
      loginError.value = '用户名或密码错误，请重试!'
    }
  } catch (error) {
    loginError.value = '登录请求失败，请检查网络连接或稍后重试！'
  }
})

onMounted(()=>{
  const savedUsername = Cookies.get('savedUsername')
  const savedPassword = Cookies.get('savedPassword')
  if (savedUsername) username.value = savedUsername
  if (savedPassword) password.value = savedPassword
})
</script>

<template>
  <v-container class="d-flex justify-center align-center" style="height: 100vh">
    <v-card class="pa-6" width="400">
      <v-card-title class="text-center">学生登录</v-card-title>
      <v-form @submit.prevent="onSubmit">
        <v-text-field
            v-model="username"
            label="用户名"
            variant="outlined"
            :error-messages="usernameError"
        ></v-text-field>

        <v-text-field
            v-model="password"
            label="密码"
            :type="showPassword?'text':'password'"
            :append-inner-icon="showPassword?'mdi-eye-off':'mdi-eye'"
            @click="showPassword=!showPassword"
            variant="outlined"
            :error-messages="passwordError"
        ></v-text-field>
        <v-checkbox
          v-model="rememberMe"
          label="记住密码"
          class="mb-2"
        ></v-checkbox>
        <v-alert v-if="loginError" type="error" class="mb-4">
          {{loginError}}
        </v-alert>
        <v-btn type="submit" block color="primary" class="mt-4">登录</v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<style scoped></style>
