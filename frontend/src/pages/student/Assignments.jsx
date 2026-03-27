import '../../public/css/dashboard.css'

export default function Assignments() {

    return (
        <>
            <div className="dashboard-content">
                <h2 className="mb-4 text-center">Assignments</h2>

                <div className="card shadow p-4">

                    <h5>English Essay</h5>

                    <p>Deadline: 25 March</p>

                    <input type="file" className="form-control mb-3" />

                    <button className="btn btn-success">
                        Submit Assignment
                    </button>

                </div>
            </div>

        </>

    )

}