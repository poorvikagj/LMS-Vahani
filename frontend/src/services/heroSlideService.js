import API from "./api"

export const getActiveHeroSlides = async () => {
  const response = await API.get("/hero-slides/public")
  return response.data
}

export const getAdminHeroSlides = async () => {
  const response = await API.get("/hero-slides/admin")
  return response.data
}

export const createHeroSlide = async (payload) => {
  const response = await API.post("/hero-slides/admin", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  })
  return response.data
}

export const updateHeroSlide = async (slideId, payload) => {
  const response = await API.put(`/hero-slides/admin/${slideId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  })
  return response.data
}

export const deleteHeroSlide = async (slideId) => {
  const response = await API.delete(`/hero-slides/admin/${slideId}`)
  return response.data
}

export const toggleHeroSlide = async (slideId, isActive) => {
  const response = await API.patch(`/hero-slides/admin/${slideId}/toggle`, { is_active: isActive })
  return response.data
}

export const reorderHeroSlides = async (slideIds) => {
  const response = await API.patch("/hero-slides/admin/reorder", { slideIds })
  return response.data
}
