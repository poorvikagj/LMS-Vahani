import Layout from "../../components/Layout";
import { useState } from "react"
import axios from "axios"

function UploadExcel(){

const [file,setFile] = useState(null)

const uploadFile = async () => {
const token = localStorage.getItem("token")
const formData = new FormData()

formData.append("file", file)

await axios.post(
"http://localhost:5000/api/excel/upload-excel",
formData,
{
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"multipart/form-data"
}
}
)
alert("Upload successful")

}

return(
<Layout>
<div className="container mt-4">

<h3>Upload Excel File</h3>

<input
type="file"
className="form-control"
onChange={(e)=>setFile(e.target.files[0])}
/>

<button
className="btn btn-primary mt-3"
onClick={uploadFile}
>
Upload
</button>

</div>
</Layout>
)

}

export default UploadExcel