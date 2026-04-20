import { useState } from "react"
import { toast } from "react-toastify"
import { changePassword } from "../../services/authService"

export default function ChangePassword() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            toast.warn("Please fill all fields")
            return
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.warn("New password and confirm password do not match")
            return
        }

        try {
            setLoading(true)
            await changePassword(form)
            toast.success("Password changed successfully")
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="dashboard-content">
            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">Change Password</h2>
                <p className="analytics-subheading mb-0">Update your account password securely.</p>
            </div>

            <div className="card shadow-sm p-4" style={{ maxWidth: "520px" }}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="currentPassword"
                            value={form.currentPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="newPassword"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? "Updating..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    )
}
