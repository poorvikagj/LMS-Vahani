import API from "./api"

export const getAnalytics = async () => {
    console.log("1234");
    
    const res = await API.get("/analytics")

    return res.data
}