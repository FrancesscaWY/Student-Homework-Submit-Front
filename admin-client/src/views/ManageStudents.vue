<script setup lang="ts">
import {ref,onMounted} from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

// 文件输入引用，用于触发隐藏的 input
const fileInput = ref<HTMLInputElement|null>(null)
// const excelFile = ref<File|null>(null)
const previewStudents = ref<Array<{StdId:string;StdName:string}>>([])
const showPreview = ref(false)
const students = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const batchSize = 19
// 表格表头
const tableHeaders=[
  {text:'序号',key:'index'},
  {text:'姓名',value:'StdName'},
  {text:'学号',value:'StdId'}
]

// 新增学生对话框相关字段
const dialogAdd = ref(false)
const StdName = ref('')
const StdId = ref('')

// 触发隐藏的文件输入
const triggerFileInput=()=>{
  fileInput.value?.click()
}

// 解析Excel文件，预览数据查看学生名单(导入学生名单功能)
const handleFileUpload = async(event:any)=> {
  const file = event.target.files[0]
  if (!file) return;

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, {type: 'array'})
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // 以二维数组形式读取数据（header:1）
    const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1}) as string[][]

    if (jsonData.length < 2) {
      alert("Excel 数据格式错误，应至少包含标题行和数据行")
      return
    }

    const [headerRow, ...rows] = jsonData
    const idIndex = headerRow.indexOf("学号")
    const nameIndex = headerRow.indexOf("姓名")

    if (idIndex === -1 || nameIndex === -1) {
      alert("Excel 文件缺少 '学号' 或 '姓名' 列")
      return
    }

    const studentData = rows.map(row => ({
      StdId: row[idIndex]?.toString().trim(),
      StdName: row[nameIndex].toString().trim()
    })).filter(student => student.StdId && student.StdName);

    if(studentData.length===0){
      alert('Excel文件没有有效的学生数据');
      uploading.value = false;
      return
    }

    // 计算进度
    let uploadedCounted = 0;
    const updateProcess = ()=>{
      uploadProgress.value = Math.floor((uploadedCounted/studentData.length)*100);
    }

    // 分批上传，模拟进度条
    for(let i=0; i<studentData.length;i+=batchSize){
      const batch = studentData.slice(i,i+batchSize);
      await axios.post('http://localhost:3001/api/admin/importStudents', {students: batch});
      uploadedCounted += batch.length;
      updateProcess();
    }
    alert("学生名单导入成功")


  }catch (error){
    console.log('导入失败：',error);
    alert('导入失败，请检查文件格式');
  }
}

// 查看学生名单
const fetchStudents = async()=>{
  try{
    const res=await axios.get('http://localhost:3001/api/admin/getStudents');
    students.value = res.data.students;
  }catch (error){
    console.error('获取学生名单失败:',error);
    alert('获取学生名单失败');
  }
};

// 添加单个学生到后端
const addStudent = async()=>{
  if(!StdName.value||!StdId.value){
    return alert("请填写完整信息")
  }
  try{
    const res = await axios.post('http://localhost:3001/api/admin/addStudent',{
      StdName: StdName.value,
      StdId: StdId.value
    })
    if(res.data.success){
      alert("添加成功")
      StdName.value=''
      StdId.value=''
      dialogAdd.value=false
    }else{
      alert("添加失败")
    }
  }catch(error){
    console.error("添加学生失败:",error)
    alert("网络错误或服务器异常")
  }
}

// 重置学生名单
const resetStudents = async()=>{
  if(!confirm('确定要重置所有学生名单吗？此操作不可恢复！')) return
  try{
    const res = await axios.post('http://localhost:3001/api/admin/resetStudents')
    if(res.data.success){
      alert("重置成功")
      // 清空预览数据（如果已加载）
      previewStudents.value = []
    }else{
      alert("重置失败")
    }
  }catch (error){
    console.error("重置学生名单失败",error)
    alert("网络错误或服务器异常")
  }
}

onMounted(() => {
  fetchStudents();
});
</script>

<template>
  <v-container>
    <h2 class="text-center mb-6">管理学生名单</h2>

    <v-row justify="space-around" class="mb-4">
      <v-col cols="auto">
        <v-btn color="primary" @click="triggerFileInput">导入学生名单</v-btn>
        <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            style="display: none"
            @change="handleFileUpload"
        />
      </v-col>
      <v-progress-linear
          v-if="uploading"
          :value="uploadProgress"
          color="blue"
          height="8"
          rounded
      ></v-progress-linear>
      <v-col cols="auto">
        <v-btn color="success" @click="dialogAdd=true">
          新增单个学生
        </v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn color="error" @click="resetStudents">
          重置学生名单
        </v-btn>
      </v-col>
    </v-row>

    <!-- 查看学生名单卡片 -->
    <v-card class="mb-4" outlined>
      <!-- 卡片头部：标题 + 下拉/刷新图标 -->
      <v-card-text class="d-flex justify-space-between align-center">
        <span class="font-weight-bold">查看学生名单</span>
        <div class="d-flex align-center" style="gap: 16px;">
          <v-btn icon @click="showPreview = !showPreview">
            <v-icon>{{ showPreview ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
          <v-btn icon @click="fetchStudents">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card-text>
      <!-- 卡片内容区域：当展开时显示学生名单表格 -->
      <v-expand-transition>
        <div v-if="showPreview">
          <v-card-text style="max-height: 400px; overflow-y: auto; padding: 0 16px 16px 16px;">
            <v-data-table
                :headers="tableHeaders"
                :items="students"
                :items-per-page="-1"
                dense
                hide-default-footer
            >
              <template v-slot:item.index="{index}">
                {{index+1}}
              </template>
            </v-data-table>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>

    <v-dialog v-model="dialogAdd" max-width="400px">
      <v-card>
        <v-card-title class="headline">新增单个学生</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addStudent">
            <v-text-field v-model="StdName" label="学生姓名" required></v-text-field>
            <v-text-field v-model="StdId" label="学生学号" required></v-text-field>
            <v-card-actions class="justify-end">
              <v-btn text @click="dialogAdd=false">取消</v-btn>
              <v-btn type="submit" color="success">添加</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>

</style>