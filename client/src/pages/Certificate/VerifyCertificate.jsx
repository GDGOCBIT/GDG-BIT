import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCertStore } from '../../store/useCertStore'
import GoogleCloud from './Template/GoogleCloud'
import GenAI24 from './Template/GenAI24'
import GoogleCloudFacilitator from './Template/GoogleCloudFacilitator'
import Core24 from './Template/Core24'
import CustomCertificate from './CustomCertificate'
import EmptyState from '../../components/EmptyState'
import { BraceTag } from '../../components/Brand'

const TEMPLATES = {
  'Google Cloud Study Jam': GoogleCloud,
  'Google Gen AI Study Jam 2024': GenAI24,
  'Core Team 24': Core24,
  'Google Cloud Study Jam Facilitator': GoogleCloudFacilitator
}

const VerifyCertificate = () => {
  const { certificateID } = useParams()
  const { certLoading, certData, fetchCertData } = useCertStore()

  useEffect(() => {
    if (certificateID) fetchCertData(certificateID)
  }, [certificateID])

  const Template = certData.template ? CustomCertificate : TEMPLATES[certData.certificate]

  return (
    <section className='wrap page-top'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8'>
        <div>
          <BraceTag>Certificate</BraceTag>
          <h1 className='title-1 mt-2'>
            {certLoading ? 'Verifying…' : certData.message ? 'Not verified' : <>Verified <b>certificate</b></>}
          </h1>
        </div>
        <span className='pill self-start sm:self-auto'>ID · {certificateID}</span>
      </div>

      {certLoading ? (
        <div className='card aspect-[16/9] skeleton max-w-[950px] mx-auto' />
      ) : certData.message ? (
        <EmptyState tone='red' title={certData.message}
          text='Check that the link or ID is exactly as printed on the certificate. If it still fails, contact an organizer.'>
          <Link to='/' className='btn btn-ink btn-sm'>Go home</Link>
        </EmptyState>
      ) : Template ? (
        <div className='cert-stage'>
          <div className='pill pill-upcoming mb-6'>✓ Issued to {certData.fullName} by GDG on Campus BIT</div>
          <Template />
        </div>
      ) : (
        <EmptyState title='Unknown certificate type' text={`“${certData.certificate}” has no template yet.`} />
      )}
    </section>
  )
}

export default VerifyCertificate
