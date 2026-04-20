import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { verifyCertificate } from "../../services/certificateService"

export default function VerifyCertificate() {
  const { code } = useParams()
  const [state, setState] = useState({ loading: true, data: null, error: "" })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await verifyCertificate(code)
        setState({ loading: false, data: res.data, error: "" })
      } catch (error) {
        setState({ loading: false, data: null, error: error.response?.data?.message || "Certificate not found" })
      }
    }
    load()
  }, [code])

  if (state.loading) {
    return <div className="p-4 text-center">Verifying certificate...</div>
  }

  if (state.error) {
    return <div className="p-4 text-center text-danger">{state.error}</div>
  }

  const c = state.data
  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <h3 className="mb-3">Certificate Verification</h3>
        <p><strong>ID:</strong> {c.certificate_code}</p>
        <p><strong>Student:</strong> {c.student_name}</p>
        <p><strong>Course:</strong> {c.course_name}</p>
        <p><strong>Issued:</strong> {new Date(c.issued_on).toLocaleDateString("en-GB")}</p>
        <p><strong>Status:</strong> {c.status}</p>
        <p className={c.status === "Active" ? "text-success" : "text-danger"}>
          {c.status === "Active" ? "This certificate is valid." : "This certificate has been revoked."}
        </p>
      </div>
    </div>
  )
}
