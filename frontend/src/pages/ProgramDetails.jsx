import Layout from "../components/Layout"
import { useState,useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

export default function Programs(){

const [programs,setPrograms] = useState([])
const [myPrograms,setMyPrograms] = useState([])
const navigate = useNavigate()

useEffect(()=>{
fetchPrograms()
fetchMyPrograms()
},[])

const fetchPrograms = async () => {

try{

const res = await API.get("/programs")

setPrograms(res.data)

}catch(err){

console.log(err)

}

}

const fetchMyPrograms = async () => {

try{

const res = await API.get("/programs/my-programs")

setMyPrograms(res.data)

}catch(err){

console.log(err)

}

}

const enrollProgram = async (program) => {

try{

await API.post("/programs/enroll",{
program_id:program.program_id
})

alert("Successfully Enrolled")

fetchMyPrograms()

}catch(err){

if(err.response?.data?.error === "Already enrolled"){
alert("Already enrolled")
}else{
alert("Enrollment failed")
}

}

}

const isEnrolled = (programId)=>{
return myPrograms.some(p => p.program_id === programId)
}

return(

<Layout>

<h2 className="mb-4">Programs</h2>

<div className="row">

{programs.map(program =>(

<div className="col-md-4 mb-4" key={program.program_id}>

<div className="card shadow">

<div className="card-body">

<h5>{program.program_name}</h5>

<p>Incharge: {program.program_incharge}</p>

<p>Total Classes: {program.total_class}</p>

<div className="d-flex gap-2">

<button
className="btn btn-info btn-sm"
onClick={()=>navigate(`/program/${program.program_id}`)}
>
Details
</button>

{isEnrolled(program.program_id) ? (

<button className="btn btn-secondary btn-sm" disabled>
Enrolled
</button>

) : (

<button
className="btn btn-primary btn-sm"
onClick={()=>enrollProgram(program)}
>
Enroll
</button>

)}

</div>

</div>

</div>

</div>

))}

</div>

</Layout>

)

}