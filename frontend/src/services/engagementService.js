import API from "./api"

export const getGamificationProfile = async () => {
  const res = await API.get("/gamification/me")
  return res.data
}

export const awardGamificationPoints = async (eventType) => {
  const res = await API.post("/gamification/award", { eventType })
  return res.data
}

export const getLeaderboard = async () => {
  const res = await API.get("/gamification/leaderboard")
  return res.data
}

export const getGrowthCoach = async () => {
  const res = await API.get("/growth-coach/student")
  return res.data
}
