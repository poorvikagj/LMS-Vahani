import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import logo from "../../assets/vahani.png"

export default function Login() {

    const navigate = useNavigate()

    const [form, setForm] = useState({ email: "", password: "", error: "" });
    let handleFrom = (event) => {
        setForm((currDetails) => { return { ...currDetails, [event.target.name]: event.target.value } });
    }

    const handleSubmit = async (e) => {
        console.log(e);

        e.preventDefault();

        try {

            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email: form.email,
                password: form.password,
            })

            localStorage.setItem("token", res.data.token)
            localStorage.setItem("role", res.data.role)

            if (res.data.role === "admin") {
                navigate("/admin-dashboard")
            } else {
                navigate("/student-dashboard")
            }

        } catch (err) {
            setForm((curr) => ({
                ...curr,
                error: err.response?.data?.message || "Login failed. Please try again."
            }));
        }

    }

    return (

        <div className="container d-flex justify-content-center align-items-center vh-100">

            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <img src={logo} alt="Vahani Scholarship Trust" style={{height:"50px",width:"170px", marginLeft:"90px"}}/>

                <h3 className="text-center mb-3 mt-3" style={{color:"#0B0D47"}}> <b>Login</b></h3>

                {form.error && <p className="text-danger text-center">{error}</p>}

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

                    <button className="btn btn-primary w-100">
                        <b>Login</b>
                    </button>

                </form>

            </div>

        </div>

    )

}