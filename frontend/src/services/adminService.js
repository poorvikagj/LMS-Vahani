import API from "./api"

export const getAnalytics = async () => {
    
    const res = await API.get("/analytics")

    return res.data
}

export const getAnalyticsSummary = async () => {
    const res = await API.get("/analytics-ai/summary")
    return res.data
}

export const askAnalyticsAI = async (query) => {
    const res = await API.post("/analytics-ai/query", { query })
    return res.data
}

export const chatAnalyticsAI = async (message) => {
    const res = await API.post("/analytics-ai/chat", { message })
    return res.data
}