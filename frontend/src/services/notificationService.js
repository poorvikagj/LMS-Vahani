import API from "./api"

export const getStudentNotifications = async () => {
  const res = await API.get("/notifications/student")
  return res.data
}

export const getAdminNotifications = async () => {
  const res = await API.get("/notifications/admin")
  return res.data
}

export const createNotification = async (payload) => {
  const res = await API.post("/notifications/admin", payload)
  return res.data
}

export const updateNotification = async (id, payload) => {
  const res = await API.put(`/notifications/admin/${id}`, payload)
  return res.data
}

export const deleteNotification = async (id) => {
  const res = await API.delete(`/notifications/admin/${id}`)
  return res.data
}
