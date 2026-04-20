import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import { getMyCertificates } from "../../services/certificateService"

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([])
  const [selected, setSelected] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const previewRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyCertificates()
        setCertificates(data)
      } catch {
        toast.error("Failed to load certificates")
      }
    }
    load()
  }, [])

  useEffect(() => {
    const generateQr = async () => {
      if (!selected) return
      const verifyLink = `${window.location.origin}/verify-certificate/${selected.certificate_code}`
      const dataUrl = await QRCode.toDataURL(verifyLink)
      setQrDataUrl(dataUrl)
    }

    generateQr()
  }, [selected])

  const downloadPdf = async () => {
    if (!previewRef.current || !selected) return

    const canvas = await html2canvas(previewRef.current, { scale: 2 })
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("landscape", "pt", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, "PNG", 20, 20, pageWidth - 40, pageHeight - 40)
    pdf.save(`${selected.certificate_code}.pdf`)
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">My Certificates</h2>
        <p className="analytics-subheading mb-0">Preview and download your completion certificates.</p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="analytics-chart-card">
            <h5>Issued Certificates</h5>
            {certificates.length === 0 ? (
              <p className="analytics-empty-note">No certificates available yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {certificates.map((item) => (
                  <button
                    key={item.certificate_id}
                    className="btn btn-outline-primary text-start"
                    onClick={() => setSelected(item)}
                  >
                    <div><strong>{item.course_name}</strong></div>
                    <small>{item.certificate_code} | {item.status}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="analytics-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Certificate Preview</h5>
              <button className="btn btn-success" onClick={downloadPdf} disabled={!selected}>Download PDF</button>
            </div>

            <div
              ref={previewRef}
              style={{
                minHeight: "360px",
                background: "linear-gradient(135deg, #fff7ed, #e0f2fe)",
                border: "2px solid #1f2937",
                borderRadius: "14px",
                padding: "28px"
              }}
            >
              {selected ? (
                <>
                  <h3 className="text-center mb-3">{selected.template_config?.title || "Certificate of Completion"}</h3>
                  <p className="text-center">This is to certify that</p>
                  <h2 className="text-center">{selected.student_name}</h2>
                  <p className="text-center">has successfully completed</p>
                  <h4 className="text-center mb-3">{selected.course_name}</h4>
                  <p className="text-center">Issued on {new Date(selected.issued_on).toLocaleDateString("en-GB")}</p>
                  <p className="text-center">Certificate ID: {selected.certificate_code}</p>
                  {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 110, height: 110, display: "block", margin: "10px auto" }} /> : null}
                </>
              ) : (
                <p className="text-center text-muted">Select a certificate to preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
