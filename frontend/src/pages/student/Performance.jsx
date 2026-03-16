import Layout from "../../components/Layout";

export default function Performance(){

return(

<Layout>

<h2 className="mb-4">Performance</h2>

<table className="table table-bordered">

<thead className="table-dark">

<tr>
<th>Program</th>
<th>Assignments</th>
<th>Tests</th>
<th>Score</th>
</tr>

</thead>

<tbody>

<tr>
<td>English</td>
<td>8 / 10</td>
<td>3 / 4</td>
<td>85%</td>
</tr>

<tr>
<td>MS Excel</td>
<td>5 / 5</td>
<td>2 / 2</td>
<td>92%</td>
</tr>

</tbody>

</table>

</Layout>

)

}