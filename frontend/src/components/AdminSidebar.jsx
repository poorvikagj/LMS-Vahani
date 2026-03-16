import { Link } from "react-router-dom";

export default function Sidebar(){

return(

<div className="sidebar vh-100 p-3" style={{width:"250px"}}>

<h4 className="text-center mb-4">Admin Panel</h4>

<ul className="nav flex-column">

<li className="nav-item">
<Link className="nav-link" to="/admin-dashboard">
Dashboard
</Link>
</li>

<li className="nav-item">
<Link className="nav-link" to="/programs">
Programs
</Link>
</li>

<li className="nav-item">
<Link className="nav-link" to="/manage-students">
Students
</Link>
</li>

<li className="nav-item">
<Link className="nav-link" to="/manage-assignments">
Assignments
</Link>
</li>

<li className="nav-item">
<Link className="nav-link" to="/analytics">
Analytics
</Link>
</li>

</ul>

</div>

)

}