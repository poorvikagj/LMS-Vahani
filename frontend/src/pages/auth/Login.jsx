import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../../services/api";
import logo from "../../assets/vahani.png"
import { toast } from "react-toastify"

export default function Login() {

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ email: "", password: "", error: "" });
    let handleFrom = (event) => {
        setForm((currDetails) => ({
            ...currDetails,
            [event.target.name]: event.target.value,
            error: "" 
        }))
    }

    const handleSubmit = async (e) => {
        console.log(e);
        setLoading(true)

        e.preventDefault();

        try {

            const res = await API.post("/auth/login", {
                email: form.email,
                password: form.password,
            })

            localStorage.setItem("token", res.data.token)
            localStorage.setItem("role", res.data.role)

            toast.success("Login successful")
            setLoading(false)
            if (res.data.role === "admin") {
                navigate("/admin-dashboard")
            } else {
                navigate("/student-dashboard")
            }

        } catch (err) {
            const errorMsg = err.response?.data?.message || "Login failed. Please try again."
            setForm((curr) => ({
                ...curr,
                error: errorMsg
            }))

            toast.error(errorMsg)
            setLoading(false)
        }

    }

    return (

        <div className="container d-flex justify-content-center align-items-center vh-100">

            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <img src={logo} alt="Vahani Scholarship Trust" style={{height:"50px",width:"170px", marginLeft:"90px"}}/>

                <h3 className="text-center mb-3 mt-3" style={{color:"#0B0D47"}}> <b>Login</b></h3>

                {form.error && <p className="text-danger text-center">{form.error}</p>}

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        {/* <label>Email</label> */}
                        <input
                            type="email"
                            className="form-control"
                            value={form.email}
                            onChange={handleFrom}
                            placeholder="Email"
                            name="email"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        {/* <label>Password</label> */}
                        <input
                            type="password"
                            className="form-control"
                            value={form.password}
                            onChange={handleFrom}
                            placeholder="Password"
                            name="password"
                            required
                        />
                    </div>

                    <button className="btn btn-primary w-100" disabled={loading}>
                        <b>{loading ? "Logging in..." : "Login"}</b>
                    </button>

                </form>

            </div>

        </div>

    )

}