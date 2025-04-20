<script setup lang="ts">
import {onMounted, ref,computed} from 'vue'
import axios from "axios";
// import { handleDownload,handlePreview } from './SubmitAssignment.vue';
import dayjs from "dayjs";
const assignments = ref<any[]>([]);
const stdName = ref('')
const stdID = ref('');
const detailsDialog = ref(false);
const selectedAssignment = ref<any>();
const assignmentDetails = ref<any>(null);
// 加载作业列表
const loadHistoryAssignments = async()=>{
  try{
    const res = await  axios.get(`http://localhost:3001/api/std/historyAssignments?stdId=${stdID.value}`);
    console.log("API返回数据：",res.data);
    assignments.value = res.data;
  }catch (error){
    console.error('加载作业失败：',error)
  }
};

onMounted(()=>{
  const storedUsername = localStorage.getItem('username');
  const StdID = localStorage.getItem('StdID');
  console.log("本地存储的 username:", storedUsername);
  console.log("本地存储的 StdID:", StdID)
  if (storedUsername) {
    stdName.value = storedUsername;
  }
  if(StdID){
    stdID.value = StdID;
  }
  loadHistoryAssignments();
})

// 计算历史作业
const historyAssignments = computed(()=>{
  const now = Date.now();
  return assignments.value.filter(assignment=>{
    const deadline = new Date(assignment.Deadline).getTime();
    return deadline < now;
  });
});

// 打开作业详情，加载历史作业提交记录
const openDetailsDialog= async(assignment: any)=>{
  selectedAssignment.value = assignment;
  const assignmentId =  selectedAssignment.value.id || selectedAssignment.value.ID;
  console.log("使用的作业ID:",assignmentId);
// 假设后端提供了获取详情接口，可以带上学号来获取对应的提交记录、次数等详细信息
  try{
    // const assignmentId = selectedAssignment.value.ID || selectedAssignment.value.id; // 兼容大写或小写
    console.log("hello")
    const res = await axios.get(`http://localhost:3001/api/std/submissionRecords`,{
      params:{
        stdId: stdID.value,
        assignmentId: assignmentId
      }
    });
    // ✅ 调试输出：打印完整响应数据
    console.log("历史作业后端响应数据：", res.data);
    if(res.data.success){
      assignmentDetails.value = {
        ...assignment,
        submitCount: res.data.records.length,
        records:  res.data.records
      }
    }else{
      assignmentDetails.value = {
        ...assignment,
        submitCount:0,
        records:[]
      }
    }
  }catch(error){
    console.error("获取作业详情失败:", error);
    assignmentDetails.value={
      ...assignment,
      submitCount:0,
      records:[]
    };
  }
  detailsDialog.value = true;
}
// 下载功能：想后端请求下载文件，并触发浏览器下载
const handleDownload = async(path:any)=>{
  try{
    const filePath = path;
    const response = await axios.get('http://localhost:3001/api/std/download',{
      params:{filePath},
      responseType: 'blob'
    })
    // 生成Blob URL用于触发下载
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    // 使用路径最后一部分作为文件名
    link.setAttribute('download',filePath.split('/').pop());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }catch (error){
    console.error("下载失败:",error);
  }
};

// 预览功能：向后端请求文件预览数据，并生成预览弹窗中的Blob URL
const handlePreview = async(path:any)=>{
  try{
    const filePath = path;

    const response = await axios.get('http://localhost:3001/api/std/preview',{
      params:{filePath},
      responseType:'blob'
    });

    // 生成Blob URL预览
    // const blob = new Blob([response.data], { type: 'application/pdf' });
    // previewUrl.value = window.URL.createObjectURL(blob);
    const previewUrl = window.URL.createObjectURL(response.data);
    // 打开预览弹窗
    // previewDialog.value = true;
    window.open(previewUrl, '_blank');
  }catch (error){
    console.error("预览失败：",error);
  }
};

const formatDeadline = (deadline: string) => {
  // 这里假设 deadline 为 ISO 字符串，不足秒数会补上 "00"
  return dayjs(deadline).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <v-container>
    <v-alert type="info" color="grey" border="start" colored-border elevation="2" class="mb-4">
      本页面所有作业已停止提交
    </v-alert>

    <h2 class="text-start mb-4">历史作业</h2>

    <v-table>
      <thead>
      <tr>
        <th>序号</th>
        <th>作业名称</th>
        <th>截止日期</th>
        <th>要求</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(assignment,index) in historyAssignments" :key="assignment.ID">
        <td>{{index+1}}</td>
        <td>{{assignment.AName}}</td>
        <td>{{formatDeadline(assignment.Deadline)}}</td>
        <td>
          <span v-if="assignment.Details.length>20">点击详情查看</span>
          <span v-else>{{assignment.Details}}</span>
        </td>
        <td>
          <v-chip :color="assignment.myStatus?'success':'error'" small>
            {{assignment.myStatus?'已提交':'未提交'}}
          </v-chip>
        </td>
        <td>
<!--          <v-btn color="primary" small disabled class="mr-2">-->
<!--            提交-->
<!--          </v-btn>-->
          <v-btn color="secondary" small @click="openDetailsDialog(assignment)">
            详情
          </v-btn>
        </td>
      </tr>
      <tr v-if="historyAssignments.length === 0">
        <td colspan="6" class="text-center">当前暂无历史作业</td>
      </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card>
        <br/>
        <v-card-title class="headline">
          {{assignmentDetails? assignmentDetails.AName:''}}
        </v-card-title>
        <v-card-text>
          <p><strong>作业要求：</strong>{{assignmentDetails ? assignmentDetails.Details: ''}}</p>
          <p><strong>截止日期：</strong>{{assignmentDetails ? formatDeadline(assignmentDetails.Deadline): ''}}</p>
          <p>
            <strong>提交状态：</strong>
            <!--            展示是否提交及提交次数-->
            {{assignmentDetails && assignmentDetails.submitCount && assignmentDetails.submitCount > 0?`已提交(${assignmentDetails.submitCount}次)`:`未提交`}}
          </p>
          <div v-if="assignmentDetails && assignmentDetails.records && assignmentDetails.records.length">
            <p><strong>提交记录:</strong></p>
            <v-timeline dot-color="grey" size="20px">
              <!--              遍历提交记录，记录里可包含提交时间、文件下载链接和预览按钮-->
              <v-timeline-item v-for="(record,i) in assignmentDetails.records" :key="i">
                <div>
                  <p>提交时间：{{ new Date(record.submitTime).toLocaleString() }}</p>
                  <br/>
                  <v-btn
                      outlined
                      small
                      color="white"
                      title="预览"
                      class="mr-4"
                      @click="handlePreview(record.filePath)">预览</v-btn>

                  <v-btn
                      outlined
                      small
                      color="black"
                      title="下载"
                      @click="handleDownload(record.filePath)">下载</v-btn>
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>
          <div v-else>
            <p>暂无提交记录</p>
          </div>
          <v-card-actions class="position-relative">
            <v-btn
                color="primary"
                @click="detailsDialog=false"
                class="position-absolute bottom-0 right-0">
              关闭
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
