import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function Login(){

const navigate = useNavigate()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [error,setError] = useState("")

const handleSubmit = async (e) => {

e.preventDefault()

try{

const res = await axios.post("http://localhost:5000/api/auth/login",{
email,
password
})

localStorage.setItem("token",res.data.token)
localStorage.setItem("role",res.data.role)

if(res.data.role === "admin"){
navigate("/admin-dashboard")
}else{
navigate("/student-dashboard")
}

}catch(err){
setError("Invalid email or password")
}

}

return(

<div className="container d-flex justify-content-center align-items-center vh-100">

<div className="card p-4 shadow" style={{width:"400px"}}>

<h3 className="text-center mb-3">Login</h3>

{error && <p className="text-danger text-center">{error}</p>}

<form onSubmit={handleSubmit}>

<div className="mb-3">
<label>Email</label>
<input
type="email"
className="form-control"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>
</div>

<div className="mb-3">
<label>Password</label>
<input
type="password"
className="form-control"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
/>
</div>

<button className="btn btn-primary w-100">
Login
</button>

</form>

</div>

</div>

)

}