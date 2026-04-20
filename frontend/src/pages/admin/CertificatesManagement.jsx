import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import {
  generateCertificate,
  getAllCertificates,
  regenerateCertificate,
  revokeCertificate,
  updateCertificate
} from "../../services/certificateService"

const initialForm = {
  student_id: "",
  program_id: "",
  student_name: "",
  course_name: "",
  issued_on: "",
  template_config: {
    title: "Certificate of Completion",
    logoText: "LMS",
    signature: "Admin"
  }
}

export default function CertificatesManagement() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState("")

  const load = async () => {
    try {
      const data = await getAllCertificates()
      setItems(data)
    } catch {
      toast.error("Failed to load certificates")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()

    if (!form.student_id || !form.program_id || !form.student_name || !form.course_name || !form.issued_on) {
      toast.warn("Please fill all required certificate fields")
      return
    }

    try {
      if (editingId) {
        await updateCertificate(editingId, form)
        toast.success("Certificate updated")
      } else {
        await generateCertificate(form)
        toast.success("Certificate generated")
      }

      setForm(initialForm)
      setEditingId(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save certificate")
    }
  }

  const startEdit = (item) => {
    setEditingId(item.certificate_id)
    setForm({
      student_id: item.student_id,
      program_id: item.program_id,
      student_name: item.student_name,
      course_name: item.course_name,
      issued_on: item.issued_on?.slice(0, 10),
      template_config: item.template_config || initialForm.template_config
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter((item) =>
      String(item.student_name || "").toLowerCase().includes(q)
      || String(item.course_name || "").toLowerCase().includes(q)
      || String(item.certificate_code || "").toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Certificate Management</h2>
        <p className="analytics-subheading mb-0">Generate, edit, revoke and regenerate certificates.</p>
      </div>

      <form className="card p-3 mb-4" onSubmit={submit}>
        <div className="row g-2">
          <div className="col-md-2">
            <input className="form-control" placeholder="Student ID" value={form.student_id} onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <input className="form-control" placeholder="Program ID" value={form.program_id} onChange={(e) => setForm((p) => ({ ...p, program_id: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <input className="form-control" placeholder="Student Name" value={form.student_name} onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <input className="form-control" placeholder="Course Name" value={form.course_name} onChange={(e) => setForm((p) => ({ ...p, course_name: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control" value={form.issued_on} onChange={(e) => setForm((p) => ({ ...p, issued_on: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">{editingId ? "Save" : "Generate"}</button>
          </div>
        </div>
      </form>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <input className="form-control" style={{ maxWidth: 320 }} placeholder="Search certificates" value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="badge text-bg-secondary">Total: {filtered.length}</span>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Code</th>
              <th>Student</th>
              <th>Course</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No certificates</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.certificate_id}>
                  <td>{item.certificate_code}</td>
                  <td>{item.student_name}</td>
                  <td>{item.course_name}</td>
                  <td>{new Date(item.issued_on).toLocaleDateString("en-GB")}</td>
                  <td>{item.status}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-2" onClick={() => startEdit(item)}>Edit</button>
                    <button className="btn btn-sm btn-danger me-2" onClick={async () => { await revokeCertificate(item.certificate_id); load() }}>Revoke</button>
                    <button className="btn btn-sm btn-success" onClick={async () => { await regenerateCertificate(item.certificate_id); load() }}>Regenerate</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
