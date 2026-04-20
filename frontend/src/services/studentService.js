import API from "./api"

export const getStudents = async()=>{
const res = await API.get("/students")
return res.data
}

export const addStudent = async(data)=>{
const res = await API.post("/students/add",data)
return res.data
}

export const deleteStudent = async(id)=>{
await API.delete(`/students/${id}`)
}

export const updateStudent = async(id,data)=>{
const res = await API.put(`/students/${id}`,data)
return res.data
}

export const getStudentsReport = async(id)=>{
const res = await API.get(`/students/${id}/report`)
return res.data
}

export const chatStudentAI = async(message, action)=>{
const res = await API.post("/student-ai/chat", { message, action })
return res.data
}

export const getStudentAIHistory = async()=>{
const res = await API.get("/student-ai/history")
return res.data
}