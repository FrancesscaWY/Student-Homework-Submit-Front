<script setup lang="ts">
import {ref,onMounted} from 'vue'
import {useRouter} from "vue-router";
import axios from "axios";

const drawer=ref(true);
const username = ref('同学')

const showLogoutDialog = ref(false);
const showChangePwdDialog = ref(false);
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 修改密码表单字段
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// 获取登录时存储的学号
const stdId = ref<string|null>(null);
const router = useRouter();

onMounted(()=>{
  const storedUsername = localStorage.getItem('username');
  const storedStdId = localStorage.getItem('StdID');
  console.log("本地存储的 username:", storedUsername); // 调试用，确保 `username` 不是 `undefined`
  console.log("本地存储的 stdId", storedStdId); // 调试用，确保 `username` 不是 `undefined`
  if (storedUsername && storedUsername !== '[object Object]') {
    username.value = storedUsername;
  }
  if(storedStdId){
    stdId.value = storedStdId;
  }
})

const handleLogout = ()=>{
  showLogoutDialog.value = true;
}

const confirmLogout =()=>{
  localStorage.removeItem('username');
  localStorage.removeItem('stdId');
  router.push('/')
}

const handleChangePwd=()=>{
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showChangePwdDialog.value = true;
}

const submitChangePwd = async ()=>{
  if(!oldPassword.value || !newPassword.value ||!confirmPassword.value){
    alert("请完整填写所有密码项！");
    return;
  }

  if(newPassword.value !== confirmPassword.value){
    alert("两次密码输入的新密码不一致！");
    return;
  }

  if(!stdId.value){
    alert("未获取到学号信息，请重新登录后再试！")
    return;
  }

  try{
    const res = await axios.post('http://localhost:3001/api/std/changePassword',{
        stdId: stdId.value,
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
    });
    if(res.data.success){
      alert("密码修改成功,请重新登录！");
      localStorage.removeItem('username');
      localStorage.removeItem('StdID');
      router.push('/');
    }else{
      alert('修改失败：' + res.data.error);
    }
  }catch(error){
    console.error("修改密码接口调用失败：",error);
    alert("服务器错误，请稍后重试！");
  }
}
const cancelChangePwd = ()=>{
  showChangePwdDialog.value = false;
}

const cancelLogout = ()=>{
  showLogoutDialog.value = false;
}

</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <v-list-item>
        <v-list-item-title class="text-h6">H1! {{username}}</v-list-item-title>
      </v-list-item>
      <v-divider></v-divider>
      <v-list nav>
        <v-list-item to="/dashboard/submit">
          <v-list-item-title>近期作业</v-list-item-title>
        </v-list-item>
        <v-list-item to="/dashboard/history">
          <v-list-item-title>历史作业</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" dense app >
      <v-btn icon @click="drawer = !drawer">
        <v-icon color="white">mdi-menu</v-icon>
      </v-btn>
      <v-toolbar-title>SE34s 作业提交平台</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text color="white" @click="handleChangePwd">修改密码</v-btn>
      <v-btn text color="white" @click="handleLogout">退出登录</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
<!--        <v-card class="content-area pa-4">-->
          <router-view/>
<!--        </v-card>-->
      </v-container>
    </v-main>

    <v-dialog v-model="showLogoutDialog" max-width="400px">
      <v-card>
        <v-card-text>确定要退出登录吗？</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="cancelLogout">取消</v-btn>
          <v-btn text color="primary" @click="confirmLogout">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showChangePwdDialog" max-width="500px">
      <v-card>
        <v-card-title calss="headline">修改密码</v-card-title>
        <v-card-text>
          <v-form>
            <!-- 显示学号（不可修改） -->
            <v-text-field
                v-model="stdId"
                label="帐号（学号）"
                readonly
                prepend-icon="mdi-account"
            ></v-text-field>

            <v-text-field
            v-model="oldPassword"
            :type="showOldPassword?'text':'password'"
            label="旧密码"
            :append-icon="showOldPassword?'mdi-eye-off':'mdi-eye'"
            variant="outlined"
            @click:append="showOldPassword = !showOldPassword"
            required
            >
            </v-text-field>
            <v-text-field
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              label="新密码"
              variant="outlined"
              :append-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showNewPassword=!showNewPassword"
              required
              >
            </v-text-field>
            <v-text-field
              v-model="confirmPassword"
              :type="showConfirmPassword ?'text':'password'"
              label="确认新密码"
              variant="outlined"
              :append-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showConfirmPassword = !showConfirmPassword"
              required
              ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="cancelChangePwd">取消</v-btn>
          <v-btn text color="primary" @click="submitChangePwd">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
/* 页面基本样式 */
.content-area {
  min-height: 300px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}
</style>