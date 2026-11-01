import { useEffect, useRef, useState } from 'react'
import { useCertStore } from '../../store/useCertStore'
import { canvasToBlob, canvasToPdfBlob, renderCertificate, safeName, saveBlob } from '../../utils/certRender'

/** Certificates made with the admin designer: drawn from template + values, fully client side. */
export default function CustomCertificate () {
  const { certData } = useCertStore()
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let alive = true
    renderCertificate(certData.template, { values: certData.values || {}, id: certData._id, verifyUrl: certData.verifyURL }, 2000)
      .then(c => { if (alive) { canvasRef.current = c; setSrc(c.toDataURL('image/jpeg', 0.9)) } })
      .catch(() => alive && setFailed(true))
    return () => { alive = false }
  }, [certData])

  const file = safeName(certData.fullName)
  const download = async kind => {
    setBusy(kind)
    const blob = kind === 'pdf' ? await canvasToPdfBlob(canvasRef.current) : await canvasToBlob(canvasRef.current)
    saveBlob(blob, `${file}.${kind}`)
    setBusy('')
  }
  const share = encodeURIComponent(certData.verifyURL)
  const title = encodeURIComponent(certData.certificate)

  return (
    <div className='flex flex-col items-center gap-6 w-full'>
      <div className='w-full max-w-[1000px] card bg-white'>
        {failed ? <p className='p-10 text-center text-[var(--black)]'>This certificate is valid, but its design image is unavailable right now. Please contact a GDG on Campus BIT organizer.</p>
          : src ? <img src={src} alt={`Certificate of ${certData.fullName}`} className='w-full h-auto block' />
          : <div className='aspect-[1.414] skeleton' />}
      </div>
      <div className='flex flex-wrap justify-center gap-3'>
        <button className='btn btn-ink' disabled={!src || !!busy} onClick={() => download('png')}>{busy === 'png' ? 'Preparing…' : 'Download PNG'}</button>
        <button className='btn btn-ghost' disabled={!src || !!busy} onClick={() => download('pdf')}>{busy === 'pdf' ? 'Preparing…' : 'Download PDF'}</button>
        <a className='btn btn-blue' target='_blank' rel='noreferrer'
          href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationId=97886448&certUrl=${share}&certId=${certData._id}`}>Add to LinkedIn</a>
        <a className='btn btn-light' target='_blank' rel='noreferrer'
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just earned a certificate from GDG on Campus BIT!')}&url=${share}`}>Share on X</a>
      </div>
    </div>
  )
}
