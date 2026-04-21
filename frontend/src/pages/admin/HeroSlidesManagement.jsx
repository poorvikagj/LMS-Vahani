import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import {
  createHeroSlide,
  deleteHeroSlide,
  getAdminHeroSlides,
  reorderHeroSlides,
  toggleHeroSlide,
  updateHeroSlide
} from "../../services/heroSlideService"

const defaultForm = {
  title: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  is_active: true,
  image: null
}

export default function HeroSlidesManagement() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [editingSlideId, setEditingSlideId] = useState(null)

  const sortedSlides = useMemo(
    () => [...slides].sort((a, b) => Number(a.display_order) - Number(b.display_order)),
    [slides]
  )

  const loadSlides = async () => {
    try {
      const data = await getAdminHeroSlides()
      setSlides(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load hero slides")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlides()
  }, [])

  const buildFormData = () => {
    const payload = new FormData()
    payload.append("title", form.title)
    payload.append("subtitle", form.subtitle)
    payload.append("button_text", form.button_text)
    payload.append("button_link", form.button_link)
    payload.append("is_active", String(form.is_active))
    if (form.image) {
      payload.append("image", form.image)
    }
    return payload
  }

  const resetForm = () => {
    setForm(defaultForm)
    setEditingSlideId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!editingSlideId && !form.image) {
      toast.error("Image is required for a new slide")
      return
    }

    setSaving(true)

    try {
      const payload = buildFormData()
      if (editingSlideId) {
        await updateHeroSlide(editingSlideId, payload)
        toast.success("Slide updated")
      } else {
        await createHeroSlide(payload)
        toast.success("Slide created")
      }
      resetForm()
      await loadSlides()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save slide")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (slide) => {
    setEditingSlideId(slide.slide_id)
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      button_text: slide.button_text || "",
      button_link: slide.button_link || "",
      is_active: Boolean(slide.is_active),
      image: null
    })
  }

  const handleDelete = async (slideId) => {
    if (!window.confirm("Delete this slide?")) return

    try {
      await deleteHeroSlide(slideId)
      toast.success("Slide deleted")
      await loadSlides()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete slide")
    }
  }

  const handleToggle = async (slide) => {
    try {
      await toggleHeroSlide(slide.slide_id, !slide.is_active)
      toast.success("Slide status updated")
      await loadSlides()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update slide status")
    }
  }

  const moveSlide = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return

    const reordered = [...sortedSlides]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const orderPayload = reordered.map((item) => item.slide_id)

    try {
      const updated = await reorderHeroSlides(orderPayload)
      setSlides(updated)
      toast.success("Slide order updated")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reorder slides")
    }
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Hero Slides Management</h2>
        <p className="analytics-subheading mb-0">Create and manage homepage banner slides.</p>
      </div>

      <form className="card p-3 mb-4" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Subtitle"
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-4">
            <input
              className="form-control"
              placeholder="Button text"
              value={form.button_text}
              onChange={(e) => setForm((prev) => ({ ...prev, button_text: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-5">
            <input
              className="form-control"
              placeholder="Button link"
              value={form.button_link}
              onChange={(e) => setForm((prev) => ({ ...prev, button_link: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-3 d-flex align-items-center">
            <label className="form-check-label d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <div className="col-12 col-md-6">
            <input
              className="form-control"
              type="file"
              accept="image/*"
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
            />
          </div>

          <div className="col-12 col-md-6 d-flex justify-content-end gap-2">
            {editingSlideId ? (
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingSlideId ? "Update Slide" : "Add Slide"}
            </button>
          </div>
        </div>
      </form>

      <div className="analytics-chart-card">
        <h5 className="mb-3">Slides</h5>

        {loading ? (
          <p className="analytics-empty-note mb-0">Loading slides...</p>
        ) : sortedSlides.length === 0 ? (
          <p className="analytics-empty-note mb-0">No slides created yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 120 }}>Preview</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th style={{ minWidth: 330 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSlides.map((slide, index) => (
                  <tr key={slide.slide_id}>
                    <td>
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        style={{ width: 100, height: 56, objectFit: "cover", borderRadius: 6 }}
                      />
                    </td>
                    <td>
                      <strong>{slide.title}</strong>
                      {slide.subtitle ? <div className="text-muted small">{slide.subtitle}</div> : null}
                    </td>
                    <td>
                      <span className={`badge ${slide.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                        {slide.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>{slide.display_order}</td>
                    <td className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        type="button"
                        onClick={() => handleEdit(slide)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        type="button"
                        onClick={() => handleToggle(slide)}
                      >
                        {slide.is_active ? "Disable" : "Enable"}
                      </button>

                      <button
                        className="btn btn-sm btn-outline-dark"
                        type="button"
                        onClick={() => moveSlide(index, -1)}
                      >
                        Move Up
                      </button>

                      <button
                        className="btn btn-sm btn-outline-dark"
                        type="button"
                        onClick={() => moveSlide(index, 1)}
                      >
                        Move Down
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        type="button"
                        onClick={() => handleDelete(slide.slide_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
