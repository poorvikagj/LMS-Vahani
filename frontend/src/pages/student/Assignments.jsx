import Layout from "../../components/Layout";

export default function Assignments(){

return(

<Layout>

<h2 className="mb-4">Assignments</h2>

<div className="card shadow p-4">

<h5>English Essay</h5>

<p>Deadline: 25 March</p>

<input type="file" className="form-control mb-3"/>

<button className="btn btn-success">
Submit Assignment
</button>

</div>

</Layout>

)

}