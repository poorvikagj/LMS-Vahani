import Layout from "../../components/Layout"
import { useState, useEffect } from "react"
import API from "../../services/api"

export default function MyPrograms(){

const [myPrograms,setMyPrograms] = useState([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
fetchMyPrograms()
},[])

const fetchMyPrograms = async () => {

try{

const res = await API.get("/programs/my-programs")

setMyPrograms(res.data)

}catch(err){

console.log(err)
alert("Failed to load programs")

}finally{

setLoading(false)

}

}

return(

<Layout>

<h2 className="mb-4">My Programs</h2>

{loading ? (

<p>Loading...</p>

) : (

<table className="table table-bordered">

<thead className="table-dark">

<tr>
<th>Program</th>
<th>Program Incharge</th>
<th>Total Classes</th>
</tr>

</thead>

<tbody>

{myPrograms.length === 0 ? (

<tr>
<td colSpan="3" className="text-center">
No programs enrolled
</td>
</tr>

) : (

myPrograms.map((p,i)=>(
<tr key={i}>
<td>{p.program_name}</td>
<td>{p.program_incharge}</td>
<td>{p.total_class}</td>
</tr>
))

)}

</tbody>

</table>

)}

</Layout>

)

}