<script setup lang="ts">
import {ref,onMounted} from "vue";
import {useRoute} from 'vue-router'
import axios from "axios";
import dayjs from "dayjs"

const route = useRoute()
// const router = useRouter()
const status = route.params.status as string
const assignments = ref<any[]>([])
const dialogVisible = ref(false)
const detail = ref<any>({})
const editDialogVisible = ref(false)
const editDetail = ref<any>({})
const selectedAssignmentIds = ref<number[]>([])
const multiSelectMode = ref(false)

onMounted(()=>{
  loadAssignment()
})

const loadAssignment = async()=>{
  console.debug('hello!')
  const res = await axios.get(`http://localhost:3001/api/admin/assignments?status=${status}`)
  assignments.value = res.data
}

const viewDetail=async (assignmentId:number)=>{
  const res = await axios.get(`http://localhost:3001/api/admin/assignmentDetail?assignmentId=${assignmentId}`)
  detail.value = res.data
  dialogVisible.value = true
}

// const collectAssignment = async(assignmentId:number)=>{
//   // 调用后端接口下载压缩包
//   const res = await axios.get(`http://localhost:3001/api/admin/collectAssignment/${assignmentId}`,{responseType:'blob'})
//   const url = window.URL.createObjectURL(new Blob([res.data]))
//   const link = document.createElement('a')
//   link.href = url
//   link.setAttribute('download',`${assignmentId}_submissions.zip}`)
//   document.body.appendChild(link)
//   link.click()
//   link.remove()
// }

// 收集作业
// 在 v-for 里：@click="collectedAssignment(assignment.ID, assignment.AName)"
const collectedAssignment = async (assignmentId: number, assignmentName: string) => {
  try {
    const res = await axios.get(
        `http://localhost:3001/api/admin/collectedAssignments/${assignmentId}`,
        { responseType: 'blob' }
    );

    // 确保是 zip
    if (res.headers['content-type'] !== 'application/zip') {
      console.error('预期 zip，但拿到：', res.headers['content-type']);
      return;
    }

    // 直接用传入的 assignmentName 拼下载名
    const blob = new Blob([res.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const downloadName = `23级软工中外34班_${assignmentName}.zip`;
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 500);
  } catch (error) {
    console.error('下载失败', error);
  }
};



// 编辑作业
const editAssignment = (assignment:any)=>{
  editDetail.value = {...assignment}
  editDialogVisible.value = true
}
const updateAssignment = async()=>{
  try{
    const res = await axios.post('http://localhost:3001/api/admin/assignmentUpdate',editDetail.value)
    if(res.data.success){
      alert('修改成功')
      editDialogVisible.value = false
      loadAssignment()
    }else{
      alert('修改失败')
    }
  }catch (error){
    console.error("作业更新错误：",error)
    alert("修改过程中出错")
  }
}

// 删除作业
const deleteAssignment = async(assignmentId:number)=>{
  if(!confirm("确定要删此除作业吗?")) return
  try{
    const res = await axios.delete(`http://localhost:3001/api/admin/assignmentDelete/${assignmentId}`)
    if(res.data.success){
      alert('删除成功')
      loadAssignment()
    }else{
      alert("删除失败")
    }
  }catch(error){
    console.error("删除作业错误：",error)
    alert("删除过程中出错")
  }
}

// 批量删除作业
// const bulkDeleteAssignments = async()=>{
//   if(selectedAssignmentIds.value.length === 0){
//     alert("请选择要删除的作业")
//     return
//   }
//   if(!confirm("确定要删除选中的作业吗？")) return
//   try{
//     const res = await axios.post('http://localhost:3001/api/admin/bulkDeleteAssignments',{
//       assignmentIds: selectedAssignmentIds.value
//     })
//     if(res.data.success){
//       alert("批量删除失败")
//     }
//   }catch(error){
//     console.error("批量删除错误：",error)
//     alert("批量删除过程中出错")
//   }
// }

// watch(()=>route.params.status,(newStatus)=>{
//   if(newStatus !== status.value){
//     status.value = newStatus as string
//     loadAssignment();
//   }
// });
const formatDeadline = (deadline: string) => {
  // 这里假设 deadline 为 ISO 字符串，不足秒数会补上 "00"
  return dayjs(deadline).format('YYYY-MM-DD HH:mm:ss')
}

const confirmBulkDelete = async () => {
  const ok = window.confirm(`确定要删除 ${selectedAssignmentIds.value.length} 个选中作业吗？`);
  if (!ok) return;
  try {
    const res = await axios.post('http://localhost:3001/api/admin/bulkDeleteAssignments', {
      assignmentIds: selectedAssignmentIds.value
    });
    if (res.data.success) {
      alert('批量删除成功');
      selectedAssignmentIds.value = [];
      multiSelectMode.value = false;
      loadAssignment();
    } else {
      alert('批量删除失败');
    }
  } catch (error) {
    console.error('批量删除错误：', error);
    alert('批量删除过程中出错');
  }
};
</script>

<template>
  <v-container>
    <!-- 多选模式切换图标，位于表格上方右侧 -->
    <div class="d-flex justify-end mb-2">
      <v-btn text samll tile @click="multiSelectMode = !multiSelectMode" color="white" title="多选模式">
        批量操作
      </v-btn>
    </div>

    <v-table>
      <thead>
      <tr>
        <th v-if="multiSelectMode">
          <v-checkbox
              :value="assignments.map(a => a.ID || a.id)"
              v-model="selectedAssignmentIds"
              hide-details
              hide-spin-buttons
            ></v-checkbox>
        </th>
        <th>序号</th>
        <th>作业名称</th>
        <th>截止日期</th>
        <th>作业要求</th>
        <th>提交进度</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(assignment,index) in assignments" :key="assignment.ID">
        <!-- 多选复选框，仅在多选模式下显示 -->
        <td v-if="multiSelectMode">
          <v-checkbox
              :value="assignment.ID || assignment.id"
              v-model="selectedAssignmentIds"
              hide-details
              hide-spin-buttons
          ></v-checkbox>
        </td>
        <td>{{ index + 1 }}</td>
        <td>{{ assignment.AName }}</td>
        <td>{{ formatDeadline(assignment.deadlineTime) }}</td>
        <td>
          <span v-if="assignment.requirements.length > 20">点击详情查看</span>
          <span v-else>{{assignment.requirements}}</span>
        </td>
        <td>{{ assignment.submitted.submitted }}/{{assignment.total.StdNum}}</td>
        <td  style="padding: 8px;">
          <v-btn small icon color="white" @click="viewDetail(assignment.ID as number)" class="mr-2 square-icon">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn samll icon class="mr-2 square-icon" color="white" @click="collectedAssignment(assignment.ID||assignment.id, assignment.AName)" title="收集作业">
            <v-icon>mdi-download</v-icon>
          </v-btn>
          <v-btn samll class="mr-2 square-icon" icon color="white" @click="editAssignment(assignment)" title="编辑作业">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon samll color="grey" class="mr-2 square-icon" @click="deleteAssignment(assignment.ID||assignment.id)" title="删除作业">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
      </tbody>
    </v-table>

<!--    查看详情-->
    <v-dialog v-model="dialogVisible" max-width="600px">
      <v-card>
        <v-card-title>{{detail.name}}</v-card-title>
        <v-card-text>
          <p><strong>作业要求：</strong>{{detail.requirements}}</p>
          <p><strong>已提交:</strong>{{ detail.submitted?.join(', ') || '暂无' }}</p>
          <p><strong>未提交：</strong>{{ detail.notSubmitted?.join(', ') || '暂无' }}</p>
          <p><strong>截止日期：</strong>{{ formatDeadline(detail.deadline) }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialogVisible=!dialogVisible">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<!--    编辑作业弹框-->
    <v-dialog v-model="editDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="headline">编辑作业</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field label="作业名称" v-model="editDetail.AName" required>
            </v-text-field>
            <v-text-field label="截止日期" v-model="editDetail.DeadlineTime" type="datetime-local" step="1" required></v-text-field>
            <v-textarea label="作业要求" v-model="editDetail.requirements" required></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="editDialogVisible=false">取消</v-btn>
          <v-btn color="primary" @click="updateAssignment">保存修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn
        v-if="multiSelectMode && selectedAssignmentIds.length > 0"
        fixed
        bottom
        right
        color="red"
        dark
        fab
        @click="confirmBulkDelete"
        title="批量删除选中作业"
    >
      <v-icon>mdi-delete</v-icon>
    </v-btn>
  </v-container>
</template>

<style scoped>
.square-icon {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px;
}
/* 悬浮按钮位置 */
.v-btn[fixed][bottom][right] {
  position: fixed;
  bottom: 24px;
  right: 24px;
}
</style>
