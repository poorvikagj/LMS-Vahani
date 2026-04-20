import API from "./api"

export const getMyCertificates = async () => {
  const res = await API.get("/certificates/student")
  return res.data
}

export const getAllCertificates = async () => {
  const res = await API.get("/certificates/admin")
  return res.data
}

export const generateCertificate = async (payload) => {
  const res = await API.post("/certificates/admin/generate", payload)
  return res.data
}

export const generateBulkCertificates = async (items) => {
  const res = await API.post("/certificates/admin/generate-bulk", { items })
  return res.data
}

export const updateCertificate = async (id, payload) => {
  const res = await API.put(`/certificates/admin/${id}`, payload)
  return res.data
}

export const revokeCertificate = async (id) => {
  const res = await API.post(`/certificates/admin/${id}/revoke`)
  return res.data
}

export const regenerateCertificate = async (id) => {
  const res = await API.post(`/certificates/admin/${id}/regenerate`)
  return res.data
}

export const verifyCertificate = async (code) => {
  const res = await API.get(`/certificates/verify/${code}`)
  return res.data
}
