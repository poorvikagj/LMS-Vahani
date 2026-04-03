import API from "./api"

export const loginUser = async (data) => {
    const res = await API.post("/auth/login", data)
    return res.data
}

export const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
}