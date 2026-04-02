import { useState } from "react"
import axios from "axios"

function UploadExcel() {

    const [file, setFile] = useState(null)

    const uploadFile = async () => {
        if (!file) {
            toast.warn("Please select a file")
            return
        }
        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            toast.error("Only Excel files are allowed")
            return
        }
        const token = localStorage.getItem("token")
        const formData = new FormData()

        formData.append("file", file)
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/excel/upload-excel`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            )
            alert("Upload successful")
            setFile(null)
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.error || "Upload failed")

        }

    }

    return (
        <>
            <div className="dashboard-content">
                <h2 className="mb-4 text-center">Upload Excel File</h2>

                    <input
                        type="file" accept=".xlsx,.xls"
                        className="form-control"
                        onChange={(e) => setFile(e.target.files[0])}
                    />

                    <button
                        className="btn btn-primary mt-3"
                        onClick={uploadFile} disabled={!file}
                    >
                        Upload
                    </button>

                </div>

        </>)

}

export default UploadExcel