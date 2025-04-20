<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
// import {useRouter} from "vue-router";
import dayjs from "dayjs";
// interface Assignment {
//   id: number;
//   name: string;
//   deadline: string;
//   status: boolean;
//   details: string;
// }

// interface StudentInfo {
//   stdName: string;
//   stdId: string;
// }

const assignments = ref<any[]>([]);
// const student = ref<StudentInfo>({ stdName: '', stdId: '' });
const file = ref<File | null>(null);
const warningMessage = ref<string>('');
const dialog = ref<boolean>(false);
const detailsDialog = ref<boolean>(false);
const selectedAssignment = ref<any>();
let stdName = ref('');
let stdID = ref('');
const assignmentDetails = ref<any>(null);

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
  loadAssignments();
  // stdName.value =storedUsername;
  // student.value.stdId =StdID;
});

// 加载待提交作业
const loadAssignments = async () => {
  try {
    const res = await axios.get(`http://localhost:3001/api/std/assignments?stdId=${stdID.value}`);
    console.log("API 返回数据:", res.data);
    assignments.value = res.data
  }catch (error){
    console.log('加载作业失败:',error);
  }
};

// onMounted(loadAssignments);

// 判断截止日期是否剩余24小时以内
const isDeadlineClose = (deadline: string): boolean => {
  const deadlineTime = new Date(deadline).getTime();
  const now = Date.now();
  const diff = deadlineTime - now;
  if (diff <= 24 * 60 * 60 * 1000 && diff > 0) {
    warningMessage.value = '黄色背景表示截止日期不足24小时，请尽快提交作业';
    return true;
  }
  return false;
};

// 打开提交作业对话框
const openSubmitDialog = (assignment: any) => {
  selectedAssignment.value = assignment;
  console.debug("hello:"+selectedAssignment.value)
  file.value = null;
  dialog.value = true;
};

// 提交作业
const handleSubmit = async () => {
  if (!stdName.value || !stdID.value || !file.value) {
    alert('请填写完整信息并选择文件');
    return;
  }
  if (!selectedAssignment.value) return;

  const formData = new FormData();
  formData.append('stdName',stdName.value);
  formData.append('stdId', stdID.value);
  formData.append('assignmentId', selectedAssignment.value.ID.toString());
  formData.append('file', file.value);

  try{
    const res = await axios.post('http://localhost:3001/api/std/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success) {
      await loadAssignments();
      // 更新作业状态
      // selectedAssignment.value.Status = 1;
      dialog.value = false;
      alert('提交成功')
    } else {
      alert('提交失败');
    }
  }catch(error){
    console.error('数据请求错误'+error);
    alert('提交过程中遇到错误');
  }

};

// 打开详情窗口
const openDetailsDialog= async(assignment: any)=>{
  selectedAssignment.value = assignment;
// 假设后端提供了获取详情接口，可以带上学号来获取对应的提交记录、次数等详细信息
  try{
    const res = await axios.get(`http://localhost:3001/api/std/submissionRecords`,{
      params:{
        stdId: stdID.value,
        assignmentId: selectedAssignment.value.ID
      }
    });
    // ✅ 调试输出：打印完整响应数据
    console.log("后端响应数据：", res.data);
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
    <v-alert type="info" color="white" border="start" colored-border elevation="2" class="mb-4">
      本页面为近期需要提交的作业
      <br/>
      点击“详情”可查看具体要求及提交记录
    </v-alert>
    <h2 class="text-start mb-4">近期作业</h2>

    <!-- 作业列表 -->
<!--    <v-card class="mb-4">-->
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
        <tr
          v-for="(assignment,index) in assignments"
          :key="assignment.ID"
          :class="{'deadline-close': isDeadlineClose(assignment.Deadline)}"
        >
          <td>{{index + 1}}</td>
          <td>{{assignment.AName}}</td>
          <td>
            {{formatDeadline(assignment.Deadline)}}
<!--            <v-alert-->
<!--                type="warning"-->
<!--                dense-->
<!--                v-if="isDeadlineClose(assignment.Deadline) && !assignment.myStatus"-->
<!--                small-->
<!--            >-->
<!--              距截止日期不足24小时，请尽快提交作业-->
<!--            </v-alert>-->
          </td>
          <td>
            <span v-if="assignment.Details.length > 20">点击详情查看</span>
            <span v-else>{{assignment.Details}}</span>
          </td>
          <td>
            <v-chip :color="assignment.myStatus?'success':'error'" small>
              {{assignment.myStatus?'已提交':'未提交'}}
            </v-chip>
          </td>
          <td>
            <v-btn color="primary" small @click="openSubmitDialog(assignment)" class="mr-2 ">
              提交
            </v-btn>
            <v-btn color="secondary" small @click="openDetailsDialog(assignment)">详情</v-btn>
          </td>
        </tr>
        <tr v-if="assignments.length === 0">
          <td colspan="6" class="text-center">近期暂无作业</td>
        </tr>
        </tbody>
      </v-table>
<!--    </v-card>-->

    <v-alert type="warning" v-if="warningMessage" class="deadline-alert">
      {{ warningMessage }}
    </v-alert>

    <!-- 提交作业对话框 -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="headline"> 提交作业 </v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field label="姓名" v-model="stdName" required readonly></v-text-field>
            <v-text-field label="学号" v-model="stdID" required readonly></v-text-field>
            <v-file-input label="选择文件" v-model="file" required></v-file-input>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="handleSubmit">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<!--    作业详情弹框-->
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


<style scoped>
.deadline-close {
  /* 如需移除背景色，可将背景色属性清空 */
  background-color: #fefeef;
}
/* 保留黄色边框，但移除背景色 */
.deadline-alert {
  border: 1px solid #ffc107; /* Vuetify warning 主题黄色 */
  background-color: transparent !important;
  box-shadow: none !important;
  color: #333 !important; /* 显示深色文字 */
  padding: 4px 8px;
  margin-top: 4px;
}

.equal-btn {
  min-width: 100px; /* 根据实际需求进行调整 */
}

</style>
