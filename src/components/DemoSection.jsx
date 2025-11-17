import { useMemo, useState } from 'react'
import builderScreenshot from '../assets/builder-screenshot.png'

const DEMO_VIDEO_PATH = '/demo-loop.mp4'
const DEMO_GIF_PATH = '/demo.gif'

function DemoVideoModal({ isOpen, onClose, useFallback }) {
  if (!isOpen) return null

  return (
    <div className="demo-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
      <div className="demo-modal" role="document">
        <button
          type="button"
          className="demo-modal-close"
          onClick={onClose}
          aria-label="Close demo video"
        >
          ×
        </button>
        <h3 id="demo-modal-title" className="demo-modal-title">CloLabs Demo</h3>
        {useFallback ? (
          <img
            src={DEMO_GIF_PATH}
            className="demo-modal-video"
            alt="Animated preview showcasing CloLabs workflow builder steps"
          />
        ) : (
          <video
            className="demo-modal-video"
            src={DEMO_VIDEO_PATH}
            controls
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  )
}

function DemoSection({ user, navigate }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFallbackMedia, setIsFallbackMedia] = useState(false)

  const handleTryExample = () => {
    const targetPath = '/builder?example=welcome-workflow'
    if (user) {
      navigate(targetPath)
    } else {
      const redirect = encodeURIComponent(targetPath)
      navigate(`/signup?redirect=${redirect}`)
    }
  }

  const handleWatchDemo = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleMediaError = () => {
    setIsFallbackMedia(true)
  }

  const mediaElement = useMemo(() => {
    return (
      <img
        className="demo-video"
        src={builderScreenshot}
        alt="CloLabs workflow builder interface showing drag-and-drop automation canvas"
      />
    )
  }, [])

  return (
    <>
      <section className="landing-section demo-section" aria-labelledby="demo-heading">
        <div className="section-container demo-layout">
          <div className="demo-media">
            {mediaElement}
          </div>
          <div className="demo-content">
            <h2 id="demo-heading" className="section-title">See CloLabs in action</h2>
            <p className="section-description demo-description">
              Watch a real workflow come together in seconds. Explore how CloLabs blends AI guidance with visual automation tools.
            </p>
            <div className="demo-actions" role="group" aria-label="Demo actions">
              <button
                type="button"
                className="demo-primary-button"
                onClick={handleTryExample}
                aria-label="Try example workflow"
              >
                Try Example
              </button>
              <button
                type="button"
                className="demo-secondary-button"
                onClick={handleWatchDemo}
                aria-label="Watch full demo video"
              >
                Watch Full Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <DemoVideoModal isOpen={isModalOpen} onClose={handleCloseModal} useFallback={isFallbackMedia} />
    </>
  )
}

export default DemoSection
