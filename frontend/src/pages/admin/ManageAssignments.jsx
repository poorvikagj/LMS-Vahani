import Layout from "../../components/Layout";

export default function ManageAssignments() {

    const assignments = [
        { name: "Essay Writing", program: "English" },
        { name: "Excel Dashboard", program: "Excel" }
    ]

    return (

        <>
            <Layout></Layout>
            <div className="dashboard">

            <h2 className="mb-4">Assignment Management</h2>

            <table className="table table-bordered">

                <thead className="table-dark">

                    <tr>
                        <th>Assignment</th>
                        <th>Program</th>
                        <th>Action</th>
                    </tr>

                </thead>

                <tbody>

                    {assignments.map((a, i) => (

                        <tr key={i}>

                            <td>{a.name}</td>
                            <td>{a.program}</td>

                            <td>
                                <button className="btn btn-sm btn-primary me-2">
                                    Edit
                                </button>

                                <button className="btn btn-sm btn-danger">
                                    Delete
                                </button>
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

        </>

    )

}