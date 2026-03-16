import API from "./api"

export const getPrograms = async()=>{
const res = await API.get("/programs")
return res.data
}

export const enrollProgram = async(programId)=>{
const res = await API.post("/enrollments",{program_id:programId})
return res.data
}