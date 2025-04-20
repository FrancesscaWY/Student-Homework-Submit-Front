<script setup lang="ts">
import {ref} from 'vue'
const drawer = ref(true)
// const reloadPage=()=>{
//   window.location.reload();
// }
</script>

<template>
  <v-app>
    <v-navigation-drawer app v-model="drawer">
<!--      <v-list>-->
      <v-list-item>
        <v-list-item-title class="text-h6">菜单</v-list-item-title>
      </v-list-item>
      <v-divider></v-divider>
      <v-list nav>
        <v-list-item link to="/dashboard/manage-students">
          <v-list-item-title>管理学生名单</v-list-item-title>
        </v-list-item>
        <v-list-item link to="/dashboard/publish-assignment">
          <v-list-item-title>发布作业</v-list-item-title>
        </v-list-item>
        <v-list-item link  to="/dashboard/assignment/pending">
          <v-list-item-title>待完成作业</v-list-item-title>
        </v-list-item>
        <v-list-item link to="/dashboard/assignment/completed">
          <v-list-item-title>已完成作业</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dense >
      <v-btn icon @click="drawer=!drawer">
        <v-icon color="dark">mdi-menu</v-icon>
      </v-btn>
      <v-toolbar-title>管理员系统</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
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