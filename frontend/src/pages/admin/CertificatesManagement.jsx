import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { getPrograms } from "../../services/programService"
import {
  generateCertificate,
  generateBulkCertificates,
  getEnrolledStudentsByProgram,
  getAllCertificates,
  regenerateCertificate,
  revokeCertificate,
  updateCertificate
} from "../../services/certificateService"

const initialForm = {
  student_id: "",
  program_id: "",
  issued_on: "",
  template_config: {
    title: "Certificate of Completion",
    logoText: "LMS",
    signature: "Admin"
  }
}

export default function CertificatesManagement() {
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState("")
  const [bulkStudentIds, setBulkStudentIds] = useState([])

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

    const loadSelectors = async () => {
      try {
        const programData = await getPrograms()
        setPrograms(Array.isArray(programData) ? programData : [])
      } catch {
        toast.error("Failed to load program list for certificate form")
      }
    }

    loadSelectors()
  }, [])

  useEffect(() => {
    const loadEnrolledStudents = async () => {
      if (!form.program_id) {
        setStudents([])
        setBulkStudentIds([])
        return
      }

      try {
        const data = await getEnrolledStudentsByProgram(form.program_id)
        setStudents(Array.isArray(data) ? data : [])
      } catch {
        setStudents([])
        toast.error("Failed to load enrolled students for selected program")
      }
    }

    loadEnrolledStudents()
  }, [form.program_id])

  const submit = async (event) => {
    event.preventDefault()

    if (!form.student_id || !form.program_id || !form.issued_on) {
      toast.warn("Please fill all required certificate fields")
      return
    }

    try {
      if (editingId) {
        await updateCertificate(editingId, form)
        toast.success("Certificate updated")
      } else {
        await generateCertificate({
          student_id: form.student_id,
          program_id: form.program_id,
          issued_on: form.issued_on,
          template_config: form.template_config
        })
        toast.success("Certificate generated")
      }

      setForm(initialForm)
      setEditingId(null)
      setBulkStudentIds([])
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save certificate")
    }
  }

  const generateForSelectedStudents = async () => {
    if (!form.program_id || !form.issued_on) {
      toast.warn("Select Program and Issue Date before bulk generation")
      return
    }

    if (bulkStudentIds.length === 0) {
      toast.warn("Select at least one student for bulk generation")
      return
    }

    try {
      const items = bulkStudentIds.map((studentId) => ({
        student_id: studentId,
        program_id: form.program_id,
        issued_on: form.issued_on,
        template_config: form.template_config
      }))

      const result = await generateBulkCertificates(items)
      toast.success(`Certificates generated: ${result.created?.length || 0}`)
      if (result.skipped?.length) {
        toast.info(`Skipped: ${result.skipped.length} (duplicate or invalid)`)
      }
      setBulkStudentIds([])
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || "Bulk generation failed")
    }
  }

  const startEdit = (item) => {
    setEditingId(item.certificate_id)
    setForm({
      student_id: item.student_id,
      program_id: item.program_id,
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
            <select
              className="form-select"
              value={form.student_id}
              onChange={(e) => {
                const selectedId = e.target.value
                setForm((prev) => ({ ...prev, student_id: selectedId }))
              }}
            >
              <option value="">Select Enrolled Student</option>
              {students.map((student) => (
                <option key={student.student_id} value={student.student_id}>{student.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={form.program_id}
              onChange={(e) => {
                const selectedId = e.target.value
                setForm((prev) => ({ ...prev, program_id: selectedId }))
              }}
            >
              <option value="">Select Program</option>
              {programs.map((program) => (
                <option key={program.program_id} value={program.program_id}>{program.program_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control" value={form.issued_on} onChange={(e) => setForm((p) => ({ ...p, issued_on: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">{editingId ? "Save" : "Generate"}</button>
          </div>
        </div>

        {!editingId ? (
          <div className="row g-2 mt-2 align-items-end">
            <div className="col-md-8">
              <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Generate for Multiple Students</strong>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setBulkStudentIds(students.map((student) => Number(student.student_id)))}
                      disabled={!students.length}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setBulkStudentIds([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <p className="text-muted mb-0">Select a program to view enrolled students.</p>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {students.map((student) => {
                      const selected = bulkStudentIds.includes(Number(student.student_id))
                      return (
                        <label key={student.student_id} className="form-check d-flex align-items-center gap-2 mb-0 py-1 px-1 border rounded">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selected}
                            onChange={(e) => {
                              const id = Number(student.student_id)
                              setBulkStudentIds((prev) => {
                                if (e.target.checked) {
                                  return prev.includes(id) ? prev : [...prev, id]
                                }
                                return prev.filter((value) => value !== id)
                              })
                            }}
                          />
                          <span>{student.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
              <small className="text-muted">Only students enrolled in the selected program are shown.</small>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button type="button" className="btn btn-outline-primary w-100" onClick={generateForSelectedStudents}>
                Generate for Selected Students
              </button>
            </div>
          </div>
        ) : null}
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
