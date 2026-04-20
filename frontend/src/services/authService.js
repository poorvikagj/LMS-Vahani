import API from "./api"

export const loginUser = async (data) => {
    const res = await API.post("/auth/login", data)
    return res.data
}

export const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
}

export const changePassword = async (data) => {
    const res = await API.post("/auth/change-password", data)
    return res.data
}