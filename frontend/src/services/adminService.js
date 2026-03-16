import API from "./api"

export const getAnalytics = async()=>{
const res = await API.get("/admin/analytics")
return res.data
}