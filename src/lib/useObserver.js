// based on https://medium.com/@eymaslive/react-hooks-useobserve-use-resizeobserver-custom-hook-45ec95ad9844
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

const useObserver = ({ callback, element }) => {
  const current = element && element.current
  const observer = useRef(null)

  useEffect(() => {
    // if we are already observing old element
    if (observer && observer.current && current) {
      observer.current.unobserve(current)
    }

    observer.current = new ResizeObserver(callback)
    observe()

    // callback for unmount
    return () => {
      if (observer && observer.current && element && element.current) {
        observer.current.unobserve(element.current)
      }
    }
  }, [current])

  const observe = () => {
    if (element && element.current && observer.current) {
      observer.current.observe(element.current)
    }
  }
}

useObserver.propTypes = {
  element: PropTypes.object,
  callback: PropTypes.func,
}

export default useObserver
