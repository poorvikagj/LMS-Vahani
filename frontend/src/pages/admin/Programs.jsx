import { useEffect, useState } from "react"
import { getPrograms, enrollProgram } from "../../services/programService"

export default function Programs() {

    const [programs, setPrograms] = useState([])

    useEffect(() => {
        fetchPrograms()
    }, [])

    const fetchPrograms = async () => {
        const data = await getPrograms()
        setPrograms(data)
    }

    const enroll = async (id) => {
        await enrollProgram(id)
        alert("Enrolled Successfully")
    }

    return (

        <>
            <div className="dashboard-content">

            <h2 className="mb-4 text-center">Programs</h2>

            <div className="row">

                {programs.map(program => (

                    <div className="col-md-4 mb-4" key={program.program_id}>

                        <div className="card shadow">

                            <div className="card-body">

                                <h5>{program.program_name}</h5>

                                <p>Instructor: {program.program_incharge}</p>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => enroll(program.program_id)}
                                >
                                    Enroll
                                </button>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>

        </>

    )

}