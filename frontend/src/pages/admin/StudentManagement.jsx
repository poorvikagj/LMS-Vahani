import { useEffect, useState } from "react"
import {
  getStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  getStudentsReport
} from "../../services/studentService"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function StudentManagement() {

  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [search, setSearch] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    batch: ""
  })

  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err) {
      console.log(err)
      toast.error("Failed to load students")
    }
  }

  // HANDLE FORM CHANGE
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // ADD / UPDATE STUDENT
  const handleSubmit = async (e) => {

    e.preventDefault()
    if (!form.name || !form.email || !form.batch) {
      toast.warn("Please fill all fields")
      return
    }
    try {
      if (editId) {

        await updateStudent(editId, form)
        toast.success("Student updated successfully")
        setEditId(null)

      } else {

        await addStudent({
          ...form,
          password: "default123"
        })
        toast.success("Student added successfully")
      }

      setForm({
        name: "",
        email: "",
        batch: ""
      })

      fetchStudents()
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.error || "Operation failed")
    }

  }

  // DELETE STUDENT
  const handleDelete = async (id) => {

    if (!window.confirm("Delete student?")) return

    try {
      await deleteStudent(id)
      toast.success("Student deleted successfully")
      fetchStudents()
    } catch (err) {
      console.log(err)
      toast.error("Delete failed")
    }

  }

  const viewReport = async (id) => {
    navigate(`/students/${id}/report`)
  }

  // EDIT STUDENT
  const handleEdit = (student) => {

    setForm({
      name: student.name,
      email: student.email,
      batch: student.batch
    })

    setEditId(student.student_id)

  }

  // SEARCH FILTER
  const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase().includes(search.toLowerCase())) ||
    (s.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (

    <>
      <div className="dashboard-content">

        <h2 className="mb-4 text-center">Student Management</h2>

        {/* ADD STUDENT FORM */}

        <form onSubmit={handleSubmit} className="card p-3 mb-4 shadow">

          <div className="row g-2">

            <div className="col">
              <input
                name="name"
                placeholder="Name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="col">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="col">
              <input
                name="batch"
                placeholder="Batch"
                className="form-control"
                value={form.batch}
                onChange={handleChange}
              />
            </div>

            <div className="col d-flex gap-2">

              <button className="btn btn-primary">
                {editId ? "Update Student" : "Add Student"}
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={() => navigate("/upload-excel")}
              >
                Upload Excel
              </button>

            </div>

          </div>

        </form>

        {/* SEARCH */}

        <input
          className="form-control mb-3"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped">

            <thead className="table-dark">

              <tr>
                {/* <th>ID</th> */}
                <th>Name</th>
                <th>Email</th>
                <th>Batch</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredStudents.map(student => (

                <tr key={student.student_id}>

                  {/* <td>{student.student_id}</td> */}
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.batch}</td>

                  <td>

                    <button
                      className="btn btn-sm me-3"
                      onClick={() => viewReport(student.student_id)}
                    >
                      View Report <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>

                    <button
                      className="btn btn-sm me-3"
                      onClick={() => handleEdit(student)}
                    >
                      Edit <i class="fa-solid fa-pencil"></i>
                    </button>

                    <button
                      className="btn btn-sm "
                      onClick={() => handleDelete(student.student_id)}
                    >
                      Delete <i class="fa-solid fa-delete-left"></i>
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>
        </div>
      </div>

    </>

  )

}