<script setup lang="ts">
import {ref} from 'vue'
import axios from 'axios'

const assignmentName = ref('')
const deadline = ref('')
const requirements = ref('')

const publishAssignment = async()=>{
  if(!assignmentName.value||!deadline.value||!requirements.value){
    return alert('请填写完整信息')
  }
  try{
    const res = await axios.post('http://localhost:3001/api/admin/publishAssignment',{
      assignmentName: assignmentName.value,
      deadline: deadline.value,
      requirements: requirements.value
    })

    if(res.data.success){
      alert(assignmentName.value+'发布成功！')
    }else{
      alert(assignmentName.value+'发布失败！')
    }
  }catch (error){
    console.error(error)
    alert('作业发布失败!')
  }

}
</script>

<template>
  <v-container>
    <h2>发布作业</h2>
    <v-form @submit.prevent="publishAssignment">
      <v-text-field v-model="assignmentName" label="作业名称" required step="1"></v-text-field>
      <v-text-field v-model="deadline" label="截止日期" type="datetime-local" required></v-text-field>
      <v-textarea v-model="requirements" label="作业要求" required></v-textarea>
      <v-btn type="submit" color="primary">发布</v-btn>
    </v-form>
  </v-container>
</template>

<style scoped>

</style>